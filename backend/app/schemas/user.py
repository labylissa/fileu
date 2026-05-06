from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

from backend.app.models.user import Role


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Role = Role.locataire


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: Role
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
