from fastapi import FastAPI
from app.routers import health, games, auth

app = FastAPI(title="Game Hub API")

app.include_router(health.router)
app.include_router(games.router)
app.include_router(auth.router)


from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Game
from app.schemas import GameCreate, GameRead

router = APIRouter(
    prefix="/games",
    tags=["games"],
)

@router.get("/", response_model=List[GameRead])
def list_games(db: Session = Depends(get_db)):
    games = db.query(Game).all()
    return games

@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found",
        )
    return game

@router.post("/", response_model=GameRead, status_code=status.HTTP_201_CREATED)
def create_game(game_in: GameCreate, db: Session = Depends(get_db)):
    game = Game(title=game_in.title, platform=game_in.platform)
    db.add(game)
    db.commit()
    db.refresh(game)
    return game
