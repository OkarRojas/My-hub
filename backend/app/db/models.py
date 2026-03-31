from sqlalchemy import Column, ForeignKey, Integer, String, Boolean, DateTime, Float, Text, JSON, func
from app.db.session import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    user_games = relationship("UserGame", back_populates="user")


class Game(Base):
    __tablename__ = "games"
    
    id = Column(Integer, primary_key=True, index=True)
    # Legacy columns kept for backward compatibility with existing SQLite schema.
    title = Column(String, nullable=False, default="")
    platform = Column(String, nullable=False, default="")
    rawg_id = Column(Integer, unique=True, index=True, nullable=True)
    name = Column(String(255), index=True)
    slug = Column(String(100), index=True, nullable=True)
    image = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    rating = Column(String(10), nullable=True)
    released = Column(DateTime, nullable=True)
    genres = Column(JSON, nullable=True)
    platforms = Column(JSON, nullable=True)
    # Activity fields from RAWG
    playtime = Column(Integer, nullable=True)  # Average playtime in hours
    ratings_count = Column(Integer, nullable=True)  # Total number of ratings
    added = Column(Integer, nullable=True)  # How many users added it
    reddit_count = Column(Integer, nullable=True)  # Reddit mentions
    twitch_count = Column(Integer, nullable=True)  # Twitch mentions
    youtube_count = Column(Integer, nullable=True)  # YouTube mentions
    created_at = Column(DateTime, server_default=func.now())
    
    # Relación con UserGame
    user_games = relationship("UserGame", back_populates="game")

class UserGame(Base):
    __tablename__ = "user_games"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    game_id = Column(Integer, ForeignKey("games.id"))
    hours_played = Column(Integer, default=0)
    status = Column(String(50), default="playing")
    review = Column(Text, nullable=True)
    favorite = Column(Integer, default=0)
    progress = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones
    game = relationship("Game", back_populates="user_games")
    user = relationship("User", back_populates="user_games")



if __name__ == "__main__":
    from app.db.session import engine

    Base.metadata.create_all(bind=engine)
