from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import Game, User, UserGame
from app.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/my-stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_games = (
        db.query(UserGame, Game)
        .join(Game, UserGame.game_id == Game.id)
        .filter(UserGame.user_id == current_user.id)
        .order_by(UserGame.created_at.desc(), UserGame.id.desc())
        .all()
    )

    total_hours = sum(ug.hours_played or 0 for ug, _ in user_games)
    recent_user_games = user_games[:3]

    # Historial de horas por juego (para la gráfica)
    play_history = [
        {
            "name": game.name[:4] if game.name else "N/A",
            "value": ug.hours_played or 0,
            "created_at": ug.created_at.isoformat() if ug.created_at else None,
        }
        for ug, game in user_games
    ]

    # Tabla de críticas/reviews
    reviews = [
        {
            "name": game.name or "Unknown",
            "code": game.slug or "N/A",
            "rating": float(game.rating) if isinstance(game.rating, str) and game.rating else 0,
            "status": ug.status,
            "player_count": str(ug.progress or 0),
            "created_at": ug.created_at.isoformat() if ug.created_at else None,
        }
        for ug, game in user_games
    ]

    return {
        "user_name": current_user.email.split("@")[0],
        "total_hours": round(total_hours, 1),
        "total_games": len(user_games),
        "recent_games": [
            {
                "symbol": game.slug or "?",
                "amount": game.name or "Unknown",
                "hours_played": ug.hours_played or 0,
                "score": ug.favorite or 0,
                "value": f"{ug.hours_played or 0}h",
                "change": str(ug.progress or 0),
                "tone": "asset-tone-btc"
            }
            for ug, game in recent_user_games
        ],
        "play_history": play_history if play_history else [{"name": "Sin datos", "value": 0}],
        "reviews": reviews
    }
