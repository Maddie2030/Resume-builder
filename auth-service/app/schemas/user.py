# auth-service/app/schemas/user.py

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime 

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        orm_mode = True
