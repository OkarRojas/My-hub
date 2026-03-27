from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, DateTime, Float
from sqlalchemy.orm import relationship
from app.db.session import Base
from sqlalchemy.orm import relationship
from datetime import timezone, datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    games = relationship("Game", back_populates="user")  # ← NUEVO


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    platform = Column(String, nullable=False)
    status = Column(String, default="pendiente")
    hours_played = Column(Float, default=0.0)      # 👈 nuevo
    rating = Column(Float, default=0.0)            # 👈 nuevo (0-10)
    player_count = Column(String, default="")      # 
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="games")  # ← NUEVO
    score = Column(Integer, nullable=True)  # ← NUEVO



if __name__ == "__main__":
    from app.db.session import engine

    Base.metadata.create_all(bind=engine)
