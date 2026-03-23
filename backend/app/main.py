from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, games, users

app = FastAPI(
    title="MyHub API 🎮",
    description="Gestor de bibliotecas de juegos",
    version="1.0.0"
)

# CORS para frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # o ["*"] solo para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# 404 handler
@app.get("/health")
async def health():
    return {"status": "healthy"}
