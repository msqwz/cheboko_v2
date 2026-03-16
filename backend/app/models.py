import uuid
from datetime import datetime, timedelta
from sqlalchemy import String, Text, Float, Boolean, DateTime, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base
import enum

class RoleEnum(str, enum.Enum):
    specialist = "specialist"
    location_manager = "location_manager"
    network_manager = "network_manager"
    operator = "operator"
    engineer = "engineer"
    region_manager = "region_manager"
    admin = "admin"

class TicketStatusEnum(str, enum.Enum):
    created = "created"
    opened = "opened"
    assigned = "assigned"
    enroute = "enroute"
    in_work = "in_work"
    completed = "completed"
    on_hold = "on_hold"
    canceled = "canceled"

class PriorityEnum(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[RoleEnum] = mapped_column(SAEnum(RoleEnum))
    location_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("locations.id"), nullable=True)
    network_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    region_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Location(Base):
    __tablename__ = "locations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    name: Mapped[str] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(String(500))
    legal_entity: Mapped[str] = mapped_column(String(255))
    network_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)

class Equipment(Base):
    __tablename__ = "equipment"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    serial_number: Mapped[str] = mapped_column(String(100), unique=True)
    model: Mapped[str] = mapped_column(String(255))
    location_id: Mapped[str] = mapped_column(String(36), ForeignKey("locations.id"))
    location_name: Mapped[str] = mapped_column(String(255))
    legal_entity: Mapped[str] = mapped_column(String(255))

class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("equipment.id"))
    description: Mapped[str] = mapped_column(Text)
    photos: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[TicketStatusEnum] = mapped_column(SAEnum(TicketStatusEnum), default=TicketStatusEnum.created)
    priority: Mapped[PriorityEnum] = mapped_column(SAEnum(PriorityEnum), default=PriorityEnum.medium)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    assigned_to: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)
    parts_used: Mapped[list | None] = mapped_column(JSON, nullable=True)

class TicketHistory(Base):
    __tablename__ = "ticket_history"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    ticket_id: Mapped[str] = mapped_column(String(36), ForeignKey("tickets.id"))
    status: Mapped[TicketStatusEnum] = mapped_column(SAEnum(TicketStatusEnum))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

class Comment(Base):
    __tablename__ = "comments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    ticket_id: Mapped[str] = mapped_column(String(36), ForeignKey("tickets.id"))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    text: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class Invite(Base):
    __tablename__ = "invites"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=gen_uuid)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    role: Mapped[RoleEnum] = mapped_column(SAEnum(RoleEnum))
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    used_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
