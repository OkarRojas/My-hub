from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import logging

from app.core.security import decode_access_token
from app.db.session import get_db
from app.db.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
logger = logging.getLogger(__name__)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    logger.info("[dependencies.get_current_user] called token_present=%s", bool(token))
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        logger.warning("[dependencies.get_current_user] missing token")
        raise credentials_exception

    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            logger.warning("[dependencies.get_current_user] token missing sub claim")
            raise credentials_exception
    except Exception as exc:
        logger.exception("[dependencies.get_current_user] token decode failed: %s", exc)
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        logger.warning("[dependencies.get_current_user] user not found user_id=%s", user_id)
        raise credentials_exception

    logger.info("[dependencies.get_current_user] success user_id=%s", user.id)
    return user
