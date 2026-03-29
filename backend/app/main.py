from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, games, users, dashboard
from app.db.session import engine, Base
from app.db import models  # importa todos los modelos para que Base los registre


def _ensure_sqlite_games_columns() -> None:
    # Compatibilidad para bases SQLite locales existentes sin migraciones aplicadas.
    if engine.dialect.name != "sqlite":
        return

    expected_games_columns = {
        "title": "TEXT DEFAULT ''",
        "platform": "TEXT DEFAULT ''",
        "rawg_id": "INTEGER",
        "name": "TEXT",
        "slug": "TEXT",
        "image": "TEXT",
        "description": "TEXT",
        "rating": "TEXT",
        "released": "DATETIME",
        "genres": "JSON",
        "platforms": "JSON",
    }

    expected_user_games_columns = {
        "game_id": "INTEGER",
        "review": "TEXT",
        "favorite": "INTEGER DEFAULT 0",
        "progress": "INTEGER DEFAULT 0",
    }

    with engine.begin() as conn:
        games_table_info = conn.exec_driver_sql("PRAGMA table_info(games)").fetchall()
        existing_games_columns = {row[1] for row in games_table_info}

        for column_name, ddl in expected_games_columns.items():
            if column_name not in existing_games_columns:
                conn.exec_driver_sql(f"ALTER TABLE games ADD COLUMN {column_name} {ddl}")

        # Migracion de datos desde esquema viejo a nuevo.
        if "title" in existing_games_columns and "name" in expected_games_columns:
            conn.exec_driver_sql("UPDATE games SET name = title WHERE name IS NULL AND title IS NOT NULL")
        if "platform" in existing_games_columns and "slug" in expected_games_columns:
            conn.exec_driver_sql("UPDATE games SET slug = platform WHERE slug IS NULL AND platform IS NOT NULL")
        if "name" in existing_games_columns and "title" in expected_games_columns:
            conn.exec_driver_sql("UPDATE games SET title = name WHERE (title IS NULL OR title = '') AND name IS NOT NULL")
        if "slug" in existing_games_columns and "platform" in expected_games_columns:
            conn.exec_driver_sql("UPDATE games SET platform = slug WHERE (platform IS NULL OR platform = '') AND slug IS NOT NULL")

        user_games_exists = conn.exec_driver_sql(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='user_games'"
        ).fetchone()
        if user_games_exists:
            user_games_info = conn.exec_driver_sql("PRAGMA table_info(user_games)").fetchall()
            existing_user_games_columns = {row[1] for row in user_games_info}
            for column_name, ddl in expected_user_games_columns.items():
                if column_name not in existing_user_games_columns:
                    conn.exec_driver_sql(f"ALTER TABLE user_games ADD COLUMN {column_name} {ddl}")

            # Backfill para migrar datos legacy de games.user_id a user_games.
            conn.exec_driver_sql(
                """
                INSERT INTO user_games (user_id, game_id, status, hours_played, favorite, progress, created_at)
                SELECT
                    g.user_id,
                    g.id,
                    COALESCE(g.status, 'pendiente'),
                    CAST(COALESCE(g.hours_played, 0) AS INTEGER),
                    COALESCE(g.score, 0),
                    0,
                    COALESCE(g.created_at, CURRENT_TIMESTAMP)
                FROM games g
                WHERE g.user_id IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1
                      FROM user_games ug
                      WHERE ug.user_id = g.user_id AND ug.game_id = g.id
                  )
                """
            )

app = FastAPI(
    title="MyHub API 🎮",
    description="Gestor de bibliotecas de juegos",
    version="1.0.0"
)

# CORS para frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://okarrojas.github.io",
        "https://okarrojas.github.io/My-hub",
    ],
    allow_origin_regex=r"^http://localhost:\\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear tablas al iniciar
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_games_columns()

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(games.router, prefix="/games", tags=["games"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(dashboard.router)

# Health check
@app.get("/")
async def root():
    return {
        "message": "MyHub API funcionando 🚀",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {"status": "healthy",
            "message": "hola 🚀",
            }


