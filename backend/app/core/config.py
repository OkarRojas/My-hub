from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "tu-super-secreto-aqui-genera-uno-largo"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    VITE_API_URL: str = "https://my-hub-yc50.onrender.com"
    RAWG_API_KEY: str = ""
    RAWG_BASE_URL: str = "https://api.rawg.io/api"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

settings = Settings()
