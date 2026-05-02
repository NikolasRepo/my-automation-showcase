import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class UserCreate(BaseModel):
    full_name: str
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: UserRole = UserRole.operator


class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    username: Optional[str] = None
    email: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class TokenData(BaseModel):
    user_id: str | None = None
