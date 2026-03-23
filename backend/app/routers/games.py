from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Game, User
from app.schemas import GameCreate, GameRead, GameStatusUpdate
from app.dependencies import get_current_user

router = APIRouter(tags=["games"])

@router.get("/", response_model=List[GameRead])
def list_games(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Solo juegos del usuario logueado
    return db.query(Game).filter(Game.user_id == current_user.id).all()

@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    return game

@router.post("/", response_model=GameRead, status_code=status.HTTP_201_CREATED)
def create_game(
    game_in: GameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    game = Game(
        title=game_in.title,
        platform=game_in.platform,
        user_id=current_user.id  # ← Asignar al usuario logueado
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.user_id == current_user.id  # ← Solo sus propios juegos
    ).first()

    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )

    db.delete(game)
    db.commit()
    return None


@router.patch("/{game_id}/status", response_model=GameRead)
def update_game_status(
    game_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.user_id == current_user.id
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    game.status = status
    db.commit()
    db.refresh(game)
    return game


@router.patch("/{game_id}/score", response_model=GameRead)
def update_game_score(
    game_id: int,
    score: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.user_id == current_user.id
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if score < 1 or score > 10:
        raise HTTPException(status_code=400, detail="Score debe ser entre 1 y 10")

    game.score = score
    db.commit()
    db.refresh(game)
    return game

@router.put("/{game_id}", response_model=GameRead)
def update_game(
    game_id: int,
    game_in: GameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    game = db.query(Game).filter(
        Game.id == game_id,
        Game.user_id == current_user.id
    ).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    game.title = game_in.title
    game.platform = game_in.platform
    db.commit()
    db.refresh(game)
    return game
