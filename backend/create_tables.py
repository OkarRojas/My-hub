from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MyHub API 🎮",
    description="Gestor de bibliotecas de juegos",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers - importar DESPUÉS de crear app
from app.routers.auth import router as auth_router
from app.routers.games import router as games_router
from app.routers.users import router as users_router

app.include_router(auth_router)
app.include_router(games_router)
app.include_router(users_router)

@app.get("/")
def root():
    return {"message": "MyHub API 🚀", "docs": "/docs"}
