from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class GameBase(BaseModel):
    title: str
    platform: str

class GameCreate(GameBase):
    title: str
    platform: str
    status: str = "pendiente"
    score: Optional[int] = None 
    hours_played: Optional[float] = None
    game_time: Optional[float] = None

# app/schemas.py
class GameResponse(BaseModel):
    id: int
    title: str
    platform: str

class GameRead(GameBase):
    id: int
    title: str
    platform: str
    user_id: Optional[int] = None  # NUEVO: Para mostrar a qué usuario pertenece el juego
    created_at: Optional[datetime] = None
    hours_played: Optional[float] = 0.0  # NUEVO: Para mostrar las horas jugadas
    score: Optional[int] = None  # NUEVO: Para mostrar la puntuación del juego
    status: str = "pendiente"
    
    class Config:
        from_attributes = True  # antes from_orm=True en Pydantic v1

class GameStatusUpdate(BaseModel):
    status: str


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