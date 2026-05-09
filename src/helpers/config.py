import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

from pydantic_settings import BaseSettings, SettingsConfigDict


def _build_async_db_url() -> str:
    raw = os.environ.get("DATABASE_URL", "")
    if not raw:
        return "postgresql+asyncpg://attendance_user:attendance_pass@localhost:5432/smart_attendance"

    # Replace scheme to use asyncpg driver
    if raw.startswith("postgresql://"):
        raw = raw.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql+asyncpg://", 1)

    # Strip sslmode from query string — asyncpg doesn't accept it as a URL param
    parsed = urlparse(raw)
    qs = parse_qs(parsed.query, keep_blank_values=True)
    qs.pop("sslmode", None)
    new_query = urlencode({k: v[0] for k, v in qs.items()})
    cleaned = urlunparse(parsed._replace(query=new_query))
    return cleaned


class Settings(BaseSettings):

    APP_NAME: str = "smart-attendance-system"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Database Settings - resolved from Replit env vars
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "attendance_user"
    DB_PASSWORD: str = "attendance_pass"
    DB_NAME: str = "smart_attendance"
    DB_SCHEMA: str = "public"
    DATABASE_URL: str = ""

    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Security
    SECRET_KEY: str = "changeme-please-set-a-real-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def model_post_init(self, __context):
        # Always build the async URL from the Replit DATABASE_URL env var
        object.__setattr__(self, "DATABASE_URL", _build_async_db_url())


@lru_cache()
def get_settings() -> Settings:
    return Settings()
