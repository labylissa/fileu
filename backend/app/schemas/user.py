from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
