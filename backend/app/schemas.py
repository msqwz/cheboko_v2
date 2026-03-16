from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# Auth
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class InviteRegisterRequest(BaseModel):
    token: str
    name: str
    email: str
    password: str

# User
class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    location_id: Optional[str] = None
    network_id: Optional[str] = None
    region_id: Optional[str] = None

# Tickets
class TicketCreate(BaseModel):
    equipment_id: str
    description: str
    priority: str = "medium"
    photos: list[str] = []

class TicketStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None

class AssignEngineer(BaseModel):
    engineer_id: str

class TicketReport(BaseModel):
    resolution: str
    parts: list[dict] = []

class CommentCreate(BaseModel):
    text: str

# Invites
class InviteCreate(BaseModel):
    role: str

class InviteOut(BaseModel):
    id: str
    token: str
    role: str
    created_at: datetime
    expires_at: datetime
    is_active: bool
    used_by: Optional[str] = None

# Equipment
class EquipmentCreate(BaseModel):
    serial_number: str
    model: str
    location_id: str

# Location
class LocationCreate(BaseModel):
    name: str
    address: str
    legal_entity: str
    lat: Optional[float] = None
    lng: Optional[float] = None
