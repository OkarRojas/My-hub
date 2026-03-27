from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import Game, User
from app.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/my-stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    games = db.query(Game).filter(Game.user_id == current_user.id).all()

    total_hours = sum(g.hours_played or 0 for g in games)
    recent_games = sorted(games, key=lambda g: g.id, reverse=True)[:3]

    # Historial de horas por juego (para la gráfica)
    play_history = [
        {"name": g.title[:4], "value": g.hours_played or 0}
        for g in games
    ]

    # Tabla de críticas
    reviews = [
        {
            "name": g.title,
            "code": g.platform,
            "rating": g.score if g.score is not None else (g.rating or 0),
            "status": g.status,
            "player_count": g.player_count or "N/A"
        }
        for g in games
    ]

    return {
        "user_name": current_user.email.split("@")[0],
        "total_hours": round(total_hours, 1),
        "total_games": len(games),
        "recent_games": [
            {
                "symbol": g.platform,
                "amount": g.title,
                "value": f"{g.hours_played or 0}h",
                "change": str(g.score if g.score is not None else (g.rating or 0)),
                "tone": "asset-tone-btc"
            }
            for g in recent_games
        ],
        "play_history": play_history if play_history else [{"name": "Sin datos", "value": 0}],
        "reviews": reviews
    }
