import secrets
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .config import settings
from .database import get_db, engine, Base
from .models import User, Ticket, Equipment, Location, TicketHistory, Comment, Invite
from .models import RoleEnum, TicketStatusEnum, PriorityEnum
from .auth import hash_password, verify_password, create_access_token, get_current_user, require_roles
from .schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserOut, InviteRegisterRequest,
    TicketCreate, TicketStatusUpdate, AssignEngineer, TicketReport, CommentCreate,
    InviteCreate, InviteOut, EquipmentCreate, LocationCreate,
)

app = FastAPI(title="Cheboko API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ─── AUTH ───────────────────────────────────────────────
@app.post("/api/auth/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Self-registration for network_manager only."""
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")
    user = User(
        name=req.name, email=req.email,
        hashed_password=hash_password(req.password),
        role=RoleEnum.network_manager,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=UserOut(
        id=user.id, name=user.name, email=user.email, role=user.role.value,
        network_id=user.network_id,
    ))

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=UserOut(
        id=user.id, name=user.name, email=user.email, role=user.role.value,
        location_id=user.location_id, network_id=user.network_id, region_id=user.region_id,
    ))

@app.post("/api/auth/invite-register", response_model=TokenResponse)
async def invite_register(req: InviteRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register via one-time invite link."""
    result = await db.execute(select(Invite).where(
        Invite.token == req.token, Invite.is_active == True
    ))
    invite = result.scalar_one_or_none()
    if not invite or datetime.now(timezone.utc) > invite.expires_at.replace(tzinfo=timezone.utc):
        raise HTTPException(400, "Invalid or expired invite")
    user = User(
        name=req.name, email=req.email,
        hashed_password=hash_password(req.password),
        role=invite.role,
    )
    db.add(user)
    invite.used_by = user.id
    invite.used_at = datetime.now(timezone.utc)
    invite.is_active = False
    await db.commit()
    await db.refresh(user)
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=UserOut(
        id=user.id, name=user.name, email=user.email, role=user.role.value,
    ))

# ─── TICKETS (Data Scoping) ────────────────────────────
@app.get("/api/tickets")
async def get_tickets(
    assigned_to: str = Query(None),
    status_filter: str = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get tickets with role-based Data Scoping."""
    q = select(Ticket)
    role = current_user.role.value

    # Data Scoping per role
    if role == "specialist":
        q = q.where(Ticket.created_by == current_user.id)
    elif role == "location_manager":
        eq_ids = (await db.execute(
            select(Equipment.id).where(Equipment.location_id == current_user.location_id)
        )).scalars().all()
        q = q.where(Ticket.equipment_id.in_(eq_ids)) if eq_ids else q.where(False)
    elif role == "network_manager":
        loc_ids = (await db.execute(
            select(Location.id).where(Location.network_id == current_user.network_id)
        )).scalars().all()
        eq_ids = (await db.execute(
            select(Equipment.id).where(Equipment.location_id.in_(loc_ids))
        )).scalars().all() if loc_ids else []
        q = q.where(Ticket.equipment_id.in_(eq_ids)) if eq_ids else q.where(False)
    elif role == "engineer":
        q = q.where(Ticket.assigned_to == current_user.id)

    if assigned_to:
        q = q.where(Ticket.assigned_to == assigned_to)
    if status_filter:
        q = q.where(Ticket.status == status_filter)

    q = q.order_by(Ticket.updated_at.desc())
    result = await db.execute(q)
    return result.scalars().all()

@app.post("/api/tickets", status_code=201)
async def create_ticket(
    data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ticket = Ticket(
        equipment_id=data.equipment_id,
        description=data.description,
        priority=PriorityEnum(data.priority),
        photos=data.photos,
        created_by=current_user.id,
    )
    db.add(ticket)
    await db.flush()
    history = TicketHistory(
        ticket_id=ticket.id, status=TicketStatusEnum.created, user_id=current_user.id,
    )
    db.add(history)
    await db.commit()
    await db.refresh(ticket)
    return ticket

@app.patch("/api/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str, data: TicketStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(404, "Ticket not found")
    ticket.status = TicketStatusEnum(data.status)
    ticket.updated_at = datetime.now(timezone.utc)
    history = TicketHistory(
        ticket_id=ticket_id, status=TicketStatusEnum(data.status),
        user_id=current_user.id, note=data.note,
    )
    db.add(history)
    await db.commit()
    return {"ok": True}

@app.patch("/api/tickets/{ticket_id}/assign")
async def assign_engineer(
    ticket_id: str, data: AssignEngineer,
    current_user: User = Depends(require_roles("operator", "region_manager", "admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(404, "Ticket not found")
    ticket.assigned_to = data.engineer_id
    ticket.status = TicketStatusEnum.assigned
    ticket.updated_at = datetime.now(timezone.utc)
    history = TicketHistory(
        ticket_id=ticket_id, status=TicketStatusEnum.assigned,
        user_id=current_user.id, note=f"Assigned to {data.engineer_id}",
    )
    db.add(history)
    await db.commit()
    return {"ok": True}

@app.post("/api/tickets/{ticket_id}/report")
async def submit_report(
    ticket_id: str, data: TicketReport,
    current_user: User = Depends(require_roles("engineer")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(404, "Ticket not found")
    ticket.resolution = data.resolution
    ticket.parts_used = data.parts
    ticket.status = TicketStatusEnum.completed
    ticket.updated_at = datetime.now(timezone.utc)
    history = TicketHistory(
        ticket_id=ticket_id, status=TicketStatusEnum.completed,
        user_id=current_user.id, note=data.resolution,
    )
    db.add(history)
    await db.commit()
    return {"ok": True}

@app.post("/api/tickets/{ticket_id}/comments")
async def add_comment(
    ticket_id: str, data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = Comment(ticket_id=ticket_id, user_id=current_user.id, text=data.text)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment

# ─── INVITES ────────────────────────────────────────────
@app.get("/api/invites")
async def get_invites(
    current_user: User = Depends(require_roles("admin", "region_manager")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Invite).order_by(Invite.created_at.desc()))
    return result.scalars().all()

@app.post("/api/invites", status_code=201)
async def create_invite(
    data: InviteCreate,
    current_user: User = Depends(require_roles("admin", "region_manager")),
    db: AsyncSession = Depends(get_db),
):
    invite = Invite(
        token=secrets.token_urlsafe(32),
        role=RoleEnum(data.role),
        created_by=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.INVITE_EXPIRE_HOURS),
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite

@app.delete("/api/invites/{invite_id}")
async def revoke_invite(
    invite_id: str,
    current_user: User = Depends(require_roles("admin", "region_manager")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Invite).where(Invite.id == invite_id))
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(404, "Invite not found")
    invite.is_active = False
    await db.commit()
    return {"ok": True}

# ─── USERS ──────────────────────────────────────────────
@app.get("/api/users")
async def get_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(User).where(User.is_active == True)
    if current_user.role.value == "network_manager":
        q = q.where(User.network_id == current_user.network_id)
    result = await db.execute(q)
    return result.scalars().all()

# ─── EQUIPMENT ──────────────────────────────────────────
@app.get("/api/equipment")
async def get_equipment(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Equipment)
    if current_user.role.value == "location_manager":
        q = q.where(Equipment.location_id == current_user.location_id)
    elif current_user.role.value == "network_manager":
        loc_ids = (await db.execute(
            select(Location.id).where(Location.network_id == current_user.network_id)
        )).scalars().all()
        q = q.where(Equipment.location_id.in_(loc_ids)) if loc_ids else q.where(False)
    result = await db.execute(q)
    return result.scalars().all()

@app.post("/api/equipment", status_code=201)
async def create_equipment(
    data: EquipmentCreate,
    current_user: User = Depends(require_roles("admin", "network_manager")),
    db: AsyncSession = Depends(get_db),
):
    loc_result = await db.execute(select(Location).where(Location.id == data.location_id))
    loc = loc_result.scalar_one_or_none()
    if not loc:
        raise HTTPException(404, "Location not found")
    eq = Equipment(
        serial_number=data.serial_number, model=data.model,
        location_id=data.location_id, location_name=loc.name, legal_entity=loc.legal_entity,
    )
    db.add(eq)
    await db.commit()
    await db.refresh(eq)
    return eq

# ─── LOCATIONS ──────────────────────────────────────────
@app.get("/api/locations")
async def get_locations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Location)
    if current_user.role.value == "network_manager":
        q = q.where(Location.network_id == current_user.network_id)
    result = await db.execute(q)
    return result.scalars().all()

@app.post("/api/locations", status_code=201)
async def create_location(
    data: LocationCreate,
    current_user: User = Depends(require_roles("admin", "network_manager")),
    db: AsyncSession = Depends(get_db),
):
    loc = Location(
        name=data.name, address=data.address, legal_entity=data.legal_entity,
        lat=data.lat, lng=data.lng,
        network_id=current_user.network_id if current_user.role.value == "network_manager" else None,
    )
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc

# ─── NOTIFICATIONS ──────────────────────────────────────
@app.get("/api/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    """Placeholder — returns empty list, to be connected to notification service."""
    return []

# ─── HEALTH ─────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
