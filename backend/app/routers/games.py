from typing import List
import logging
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Game, User, UserGame
from app.schemas import GameBase, GameCreate, GameRead, GameStatusUpdate
from app.dependencies import get_current_user
from app.core.config import settings
import httpx
from datetime import datetime
from dotenv import load_dotenv


logger = logging.getLogger(__name__)
router = APIRouter(tags=["games"])


def _local_search_results(db: Session, query: str) -> list[dict]:
    """Fallback local search to avoid leaving the UI waiting on RAWG issues."""
    q = query.strip()
    if not q:
        return []

    local_games = (
        db.query(Game)
        .filter(Game.name.isnot(None))
        .filter(Game.name.ilike(f"%{q}%"))
        .order_by(Game.created_at.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "game_id": game.id,
            "rawg_id": game.rawg_id,
            "name": game.name,
            "slug": game.slug,
            "image": game.image,
            "rating": float(game.rating) if game.rating else 0,
            "released": game.released.isoformat() if game.released else None,
            "genres": game.genres or [],
            "platforms": game.platforms or [],
            "description": game.description or "",
        }
        for game in local_games
    ]


def _get_rawg_api_key() -> str:
    """Gets RAWG key from settings, with .env fallback for hot-reload edge cases."""
    if settings.RAWG_API_KEY:
        return settings.RAWG_API_KEY

    env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(dotenv_path=env_path, override=False)
    return os.getenv("RAWG_API_KEY", "")


def _extract_platform_text(platforms: list[dict] | None) -> str:
    if not platforms:
        return ""
    names = [
        p.get("name").strip()
        for p in platforms
        if isinstance(p, dict) and isinstance(p.get("name"), str) and p.get("name").strip()
    ]
    return ", ".join(names)


@router.get("/search")
async def search_games(query: str, page: int = 1, db: Session = Depends(get_db)):
    """Busca juegos en RAWG y devuelve resultados"""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query requerida")

    rawg_api_key = _get_rawg_api_key()
    if not rawg_api_key:
        logger.warning("[games.search] RAWG_API_KEY missing; using local fallback")
        return {
            "results": _local_search_results(db, query),
            "next_page": None,
            "source": "local",
            "warning": "RAWG_API_KEY missing",
        }
    
    url = f"{settings.RAWG_BASE_URL}/games"
    params = {
        "key": rawg_api_key,
        "search": query.strip(),
        "page": page,
        "page_size": 10
    }
    
    try:
        timeout = httpx.Timeout(8.0, connect=3.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except (httpx.ConnectTimeout, httpx.ReadTimeout):
        logger.warning("[games.search] RAWG timeout; using local fallback")
        return {
            "results": _local_search_results(db, query),
            "next_page": None,
            "source": "local",
            "warning": "RAWG timeout",
        }
    except httpx.HTTPStatusError as exc:
        logger.warning("[games.search] RAWG HTTP error status=%s; using local fallback", exc.response.status_code)
        return {
            "results": _local_search_results(db, query),
            "next_page": None,
            "source": "local",
            "warning": f"RAWG HTTP {exc.response.status_code}",
        }
    except httpx.HTTPError as exc:
        logger.warning("[games.search] RAWG request failed: %s; using local fallback", exc)
        return {
            "results": _local_search_results(db, query),
            "next_page": None,
            "source": "local",
            "warning": "RAWG request failed",
        }
    
    # Convierte resultados a formato simple
    results = []
    for game in data.get("results", []):
        results.append({
            "rawg_id": game["id"],
            "name": game["name"],
            "slug": game["slug"],
            "image": game.get("background_image"),
            "rating": game["rating"],
            "released": game["released"],
            "genres": [{"id": g["id"], "name": g["name"]} for g in game.get("genres", [])],
            "platforms": [{"name": p["platform"]["name"]} for p in game.get("platforms", [])],
            "description": game.get("description") or ""
        })
    
    return {"results": results, "next_page": data.get("next"), "source": "rawg"}


@router.get("/detail/{rawg_id}")
async def get_game_detail(rawg_id: int, db: Session = Depends(get_db)):
    """Trae detalles completos de un juego de RAWG y lo guarda en BD local"""
    
    # Buscar si ya existe en BD local
    existing_game = db.query(Game).filter(Game.rawg_id == rawg_id).first()
    if existing_game:
        return existing_game
    
    # Consultar RAWG
    url = f"{settings.RAWG_BASE_URL}/games/{rawg_id}"
    rawg_api_key = _get_rawg_api_key()
    if not rawg_api_key:
        raise HTTPException(status_code=503, detail="RAWG_API_KEY no configurada")
    params = {"key": rawg_api_key}
    
    try:
        timeout = httpx.Timeout(8.0, connect=3.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Juego no encontrado")

            game_data = response.json()
    except (httpx.ConnectTimeout, httpx.ReadTimeout):
        raise HTTPException(status_code=504, detail="Timeout consultando datos del juego")
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Error consultando proveedor de juegos")
    
    # Guardar en BD
    game = Game(
        title=game_data["name"],
        platform=_extract_platform_text(
            [{"name": p["platform"]["name"]} for p in game_data.get("platforms", [])]
        ) or game_data.get("slug") or "unknown",
        rawg_id=game_data["id"],
        name=game_data["name"],
        slug=game_data["slug"],
        image=game_data["background_image"],
        description=game_data["description"] or "",
        rating=str(game_data["rating"]),
        released=datetime.fromisoformat(game_data["released"]) if game_data["released"] else None,
        genres=[{"id": g["id"], "name": g["name"]} for g in game_data["genres"]],
        platforms=[{"name": p["platform"]["name"]} for p in game_data["platforms"]]
    )
    
    db.add(game)
    db.commit()
    db.refresh(game)
    
    return game


@router.get("/", response_model=List[GameRead])
def list_user_games(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista los juegos del usuario logueado"""
    user_games = (
        db.query(UserGame, Game)
        .join(Game, UserGame.game_id == Game.id)
        .filter(UserGame.user_id == current_user.id)
        .order_by(UserGame.created_at.desc())
        .all()
    )
    
    result = []
    for ug, game in user_games:
        platform_text = _extract_platform_text(game.platforms)
        platform_legacy = (game.platform or "").strip() if isinstance(game.platform, str) else ""
        platform_slug = (game.slug or "").strip() if isinstance(game.slug, str) else ""
        result.append({
            "id": ug.id,
            "title": game.name or game.title,
            "platform": platform_text or platform_legacy or platform_slug or "Sin plataforma",
            "user_id": ug.user_id,
            "status": ug.status,
            "hours_played": ug.hours_played,
            "score": ug.favorite,
            "created_at": ug.created_at
        })
    
    logger.info("[games.list] user_id=%s count=%s", current_user.id, len(user_games))
    return result


@router.post("/add-to-library")
def add_game_to_library(
    rawg_id: int | None = None,
    game_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Agrega un juego a la librería del usuario"""

    if rawg_id is None and game_id is None:
        raise HTTPException(status_code=400, detail="Debes enviar rawg_id o game_id")

    # Buscar juego por rawg_id o game_id local
    game = None
    if rawg_id is not None:
        game = db.query(Game).filter(Game.rawg_id == rawg_id).first()
    elif game_id is not None:
        game = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado. Cargalo primero.")
    
    # Verificar si ya existe en la librería del usuario
    existing = db.query(UserGame).filter(
        UserGame.user_id == current_user.id,
        UserGame.game_id == game.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe en tu librería")
    
    # Crear entrada en UserGame
    user_game = UserGame(
        user_id=current_user.id,
        game_id=game.id,
        status="playing",
        hours_played=0,
        progress=0,
        favorite=0
    )
    
    db.add(user_game)
    db.commit()
    db.refresh(user_game)
    
    logger.info("[games.add] user_id=%s game_id=%s", current_user.id, game.id)
    return {"message": "Juego agregado a la librería"}


@router.delete("/{user_game_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_game(
    user_game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina un juego de la librería del usuario"""
    user_game = db.query(UserGame).filter(
        UserGame.id == user_game_id,
        UserGame.user_id == current_user.id
    ).first()

    if not user_game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")

    db.delete(user_game)
    db.commit()
    logger.info("[games.delete] user_id=%s user_game_id=%s", current_user.id, user_game_id)
    return None


@router.patch("/{user_game_id}/status")
def update_game_status(
    user_game_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza el estado de un juego"""
    user_game = db.query(UserGame).filter(
        UserGame.id == user_game_id,
        UserGame.user_id == current_user.id
    ).first()

    if not user_game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")

    user_game.status = status
    db.commit()
    db.refresh(user_game)
    
    logger.info("[games.update_status] user_id=%s user_game_id=%s status=%s", 
                current_user.id, user_game_id, status)
    return user_game


@router.patch("/{user_game_id}/score")
def update_game_score(
    user_game_id: int,
    score: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza la puntuación de un juego"""
    user_game = db.query(UserGame).filter(
        UserGame.id == user_game_id,
        UserGame.user_id == current_user.id
    ).first()

    if not user_game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")

    if score < 0 or score > 10:
        raise HTTPException(status_code=400, detail="Score debe ser entre 0 y 10")

    user_game.favorite = score
    db.commit()
    db.refresh(user_game)
    
    logger.info("[games.update_score] user_id=%s user_game_id=%s score=%s", 
                current_user.id, user_game_id, score)
    return user_game


@router.patch("/{user_game_id}/hours")
def update_game_hours(
    user_game_id: int,
    hours_played: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza las horas jugadas"""
    user_game = db.query(UserGame).filter(
        UserGame.id == user_game_id,
        UserGame.user_id == current_user.id
    ).first()

    if not user_game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")

    user_game.hours_played = hours_played
    db.commit()
    db.refresh(user_game)
    
    logger.info("[games.update_hours] user_id=%s user_game_id=%s hours=%s", 
                current_user.id, user_game_id, hours_played)
    return user_game


@router.put("/{user_game_id}")
def update_game_metadata(
    user_game_id: int,
    payload: GameBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza título/plataforma del juego en la librería del usuario."""
    user_game = db.query(UserGame).filter(
        UserGame.id == user_game_id,
        UserGame.user_id == current_user.id,
    ).first()

    if not user_game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")

    game = db.query(Game).filter(Game.id == user_game.game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")

    game.name = payload.title
    game.slug = payload.platform
    game.title = payload.title
    game.platform = payload.platform
    db.commit()

    return {
        "id": user_game.id,
        "title": game.name,
        "platform": game.slug or "unknown",
        "status": user_game.status,
        "hours_played": user_game.hours_played,
        "score": user_game.favorite,
        "created_at": user_game.created_at,
    }

