from typing import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base 
from .config import get_settings

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    # echo=settings.DEBUG, # FIXME : check the dubug , for write the sql code in run echo =
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    # autocommit=False, # no use in sqlalchemy 2.0
    autoflush=False,
)

# Base class for models
Base = declarative_base()


# Dependency to get database session
async def async_get_db() -> AsyncIterator[AsyncSession]:
    """
    Dependency function to get database session.

        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
        
    """
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Initialize database connectivity (schema managed by Alembic)."""
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))


async def close_db():
    """Close database connections."""
    await engine.dispose()
