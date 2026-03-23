from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql+psycopg2://postgres:FEYdeu94@localhost:5432/gamehub_db"

db_url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")
engine = create_engine(db_url, echo=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema_compatibility() -> None:
    """Apply tiny compatibility fixes for existing local databases."""
    inspector = inspect(engine)
    if "games" not in inspector.get_table_names():
        return

    game_columns = {column["name"] for column in inspector.get_columns("games")}
    if "created_at" not in game_columns:
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE games "
                    "ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()"
                )
            )

from typing import Generator
from sqlalchemy.orm import Session

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
