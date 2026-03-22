from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class GameBase(BaseModel):
    title: str
    platform: str

class GameCreate(GameBase):
    title: str
    platform: str

# app/schemas.py
class GameResponse(BaseModel):
    id: int
    title: str
    platform: str

class GameRead(GameBase):
    id: int
    title: str
    platform: str
    user_id: Optional[int]  # NUEVO: Para mostrar a qué usuario pertenece el juego
    created_at: Optional[datetime] 
    
    class Config:
        from_attributes = True  # antes from_orm=True en Pydantic v1

# ========= USERS =========

class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# ========= AUTH / TOKENS =========

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int | None = None
    email: EmailStr | None = None