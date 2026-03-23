from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, games, users
from app.db.session import engine, Base
from app.db import models  # importa todos los modelos para que Base los registre

app = FastAPI(
    title="MyHub API 🎮",
    description="Gestor de bibliotecas de juegos",
    version="1.0.0"
)

# CORS para frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://TU-FRONTEND.onrender.com", "https://okarrojas.github.io"],  # agrega tu URL de producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear tablas al iniciar
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(games.router, prefix="/games", tags=["games"])
app.include_router(users.router, prefix="/users", tags=["users"])

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
    return {"status": "healthy"}
