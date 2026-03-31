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
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    hours_played: Optional[float] = 0.0
    score: Optional[int] = None
    status: str = "pendiente"
    
    class Config:
        from_attributes = True


class GameActivityMetrics(BaseModel):
    """Activity metrics from RAWG for a game"""
    playtime: Optional[int] = None  # Average playtime in hours
    ratings_count: Optional[int] = None  # Total number of ratings
    added: Optional[int] = None  # How many users added it
    reddit_count: Optional[int] = None  # Reddit mentions
    twitch_count: Optional[int] = None  # Twitch mentions
    youtube_count: Optional[int] = None  # YouTube mentions
    
    class Config:
        from_attributes = True


class GameWithMetrics(GameRead):
    """Game with activity metrics"""
    activity: GameActivityMetrics = GameActivityMetrics()
    
    class Config:
        from_attributes = True

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