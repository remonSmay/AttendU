"""
Pytest configuration and fixtures for the AttendU test suite.

Provides:
- Async test database engine with SQLite and asyncpg dialect
- Session fixtures for each test
- FastAPI AsyncClient for API testing
- Dependency override for database injection
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import AsyncIterator, Generator
from unittest.mock import MagicMock

# Setup path and environment BEFORE imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Set environment variables for test mode (must be before config import)
os.environ["ENV"] = "test"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost/test"
os.environ["DEBUG"] = "false"

# Mock face_recognition module if not available
try:
    import face_recognition
except ImportError:
    sys.modules['face_recognition'] = MagicMock()

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import StaticPool

# ============================================================================
# IMPORTANT: Import all models BEFORE creating engine to register them
# ============================================================================

from Models.UserModel import User
from Models.StudentsModel import Student
from Models.CourseModel import Course
from Models.SectionsModel import Section
from Models.enrollmentsModel import Enrollment
from Models.AttendanceSessionModel import AttendanceSession
from Models.Device_attendance_events import Device, AttendanceEvent
from Models.AuditLogModel import AuditLog
from Models.base_data_model import BaseDataModel

# Get Base from helpers.database
from helpers.database import Base, async_get_db

# Now we can create a function to get async_get_db
async def mock_async_get_db() -> AsyncIterator[AsyncSession]:
    """Test dependency for database session."""
    pass

# Import app after all models are registered
from main import app as fastapi_app


# ============================================================================
# Async Event Loop Configuration
# ============================================================================

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# Test Database Setup
# ============================================================================

# Use in-memory SQLite with aiosqlite for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def test_db_engine():
    """Create a fresh test database engine for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    # Create all tables based on Base metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Cleanup: drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_db_session(
    test_db_engine,
) -> AsyncIterator[AsyncSession]:
    """Provide a test database session for each test."""
    async_session_local = async_sessionmaker(
        bind=test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async with async_session_local() as session:
        yield session
        # Auto-rollback at end of test
        await session.rollback()


# ============================================================================
# FastAPI App with Dependency Override
# ============================================================================

@pytest_asyncio.fixture
async def app_with_test_db(test_db_session: AsyncSession) -> FastAPI:
    """
    Provide FastAPI app with overridden database dependency.
    Uses the test database session for all queries.
    """

    async def override_get_db() -> AsyncIterator[AsyncSession]:
        """Override the async_get_db dependency to use test session."""
        yield test_db_session

    fastapi_app.dependency_overrides[async_get_db] = override_get_db
    yield fastapi_app
    # Cleanup overrides after test
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def async_client(app_with_test_db: FastAPI) -> AsyncIterator[AsyncClient]:
    """Provide an async HTTP client for API testing."""
    async with AsyncClient(app=app_with_test_db, base_url="http://test") as client:
        yield client


# ============================================================================
# Token Fixtures for Authenticated Requests
# ============================================================================

@pytest_asyncio.fixture
async def user_token(async_client: AsyncClient) -> str:
    """Create a regular user account and return their access token."""
    # Register a regular user (instructor role, since students don't self-register)
    register_response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test User",
            "email": "testuser@example.com",
            "password": "TestPassword123!",
            "role": "instructor",
        }
    )
    assert register_response.status_code == 201

    # Login to get token
    login_response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "testuser@example.com",
            "password": "TestPassword123!",
        }
    )
    assert login_response.status_code == 200
    return login_response.json()["tokens"]["access_token"]


@pytest_asyncio.fixture
async def admin_token(async_client: AsyncClient) -> str:
    """Create an admin account and return their access token."""
    # Register an admin user
    register_response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test Admin",
            "email": "testadmin@example.com",
            "password": "AdminPassword123!",
            "role": "admin",
        }
    )
    assert register_response.status_code == 201

    # Login to get token
    login_response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "testadmin@example.com",
            "password": "AdminPassword123!",
        }
    )
    assert login_response.status_code == 200
    return login_response.json()["tokens"]["access_token"]


# ============================================================================
# Utility Fixtures for Common Test Operations
# ============================================================================

@pytest_asyncio.fixture
async def clean_database(test_db_session: AsyncSession) -> AsyncIterator[AsyncSession]:
    """
    Fixture that ensures database is clean before and after each test.
    Yields the session for use in tests.
    """
    # Clean before test
    for table in reversed(Base.metadata.sorted_tables):
        await test_db_session.execute(table.delete())
    await test_db_session.commit()

    yield test_db_session

    # Clean after test
    for table in reversed(Base.metadata.sorted_tables):
        await test_db_session.execute(table.delete())
    await test_db_session.commit()


# ============================================================================
# Test Configuration
# ============================================================================

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Configure test environment."""
    yield
    # Cleanup if needed


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers", "asyncio: mark test as an asyncio test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )


# ============================================================================
# Async Context Manager Support
# ============================================================================

@pytest_asyncio.fixture
def mock_async_generator():
    """Helper fixture for testing async generators."""
    async def _async_gen(*values):
        for value in values:
            yield value
    return _async_gen
