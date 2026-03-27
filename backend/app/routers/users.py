from fastapi import APIRouter, Depends
import logging

from app.db.session import get_db
from app.dependencies import get_current_user
from app.db.models import User

router = APIRouter( tags=["users"])
logger = logging.getLogger(__name__)

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    logger.info("[users.me] success user_id=%s email=%s", current_user.id, current_user.email)
    return {
        "id": current_user.id,
        "email": current_user.email
        # No ponemos created_at porque no existe en el modelo
    }
