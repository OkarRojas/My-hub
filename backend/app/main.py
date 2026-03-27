from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, games, users, dashboard
from app.db.session import engine, Base
from app.db import models  # importa todos los modelos para que Base los registre


def _ensure_sqlite_games_columns() -> None:
    # Compatibilidad para bases SQLite locales existentes sin migraciones aplicadas.
    if engine.dialect.name != "sqlite":
        return

    expected_columns = {
        "status": "TEXT DEFAULT 'pendiente'",
        "hours_played": "FLOAT DEFAULT 0.0",
        "rating": "FLOAT DEFAULT 0.0",
        "player_count": "TEXT DEFAULT ''",
        "user_id": "INTEGER",
        "score": "INTEGER",
    }

    with engine.begin() as conn:
        table_info = conn.exec_driver_sql("PRAGMA table_info(games)").fetchall()
        existing = {row[1] for row in table_info}

        for column_name, ddl in expected_columns.items():
            if column_name not in existing:
                conn.exec_driver_sql(f"ALTER TABLE games ADD COLUMN {column_name} {ddl}")

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


