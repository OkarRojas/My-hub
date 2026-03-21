from pydantic import BaseModel, EmailStr

class GameBase(BaseModel):
    title: str
    platform: str

class GameCreate(GameBase):
    pass

class GameRead(GameBase):
    id: int

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