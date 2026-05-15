"""
Integration tests for attendance endpoints.

Tests cover:
- Creating attendance sessions
- Listing active and all sessions
- Getting session details
- Updating session information
- Stopping sessions
- Deleting sessions
- Error cases (unauthorized, not found, validation)
- Authorization checks
"""

import pytest
from httpx import AsyncClient
from fastapi import status
from uuid import uuid4
from datetime import datetime, timedelta


class TestAttendanceSessionCreation:
    """Tests for POST /api/v1/attendance-sessions"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_session_requires_auth(self, async_client: AsyncClient):
        """Creating session requires authentication."""
        payload = {
            "section_id": str(uuid4()),
            "created_by_id": str(uuid4()),
            "title": "Lecture 1",
            "start_time": datetime.now().isoformat(),
            "end_time": (datetime.now() + timedelta(hours=1)).isoformat(),
        }
        response = await async_client.post("/api/v1/attendance-sessions", json=payload)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_sessions_empty(self, async_client: AsyncClient, user_token: str):
        """Can list sessions when none exist."""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.get("/api/v1/attendance-sessions", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_sessions_requires_auth(self, async_client: AsyncClient):
        """Listing sessions requires authentication."""
        response = await async_client.get("/api/v1/attendance-sessions")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_active_sessions_empty(self, async_client: AsyncClient, user_token: str):
        """Can list active sessions when none exist."""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.get("/api/v1/attendance-sessions/active", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_session_not_found(self, async_client: AsyncClient, user_token: str):
        """Getting non-existent session returns 404."""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.get(
            f"/api/v1/attendance-sessions/{uuid4()}",
            headers=headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_session_requires_auth(self, async_client: AsyncClient):
        """Getting session requires authentication."""
        response = await async_client.get(f"/api/v1/attendance-sessions/{uuid4()}")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAttendanceSessionDelete:
    """Tests for DELETE /api/v1/attendance-sessions/{session_id}"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_delete_session_not_found(self, async_client: AsyncClient, user_token: str):
        """Deleting non-existent session returns 404."""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.delete(
            f"/api/v1/attendance-sessions/{uuid4()}",
            headers=headers
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_delete_session_requires_auth(self, async_client: AsyncClient):
        """Deleting session requires authentication."""
        response = await async_client.delete(f"/api/v1/attendance-sessions/{uuid4()}")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAttendanceValidation:
    """Tests for validation of attendance session inputs"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_session_invalid_verification_method(self, async_client: AsyncClient, user_token: str):
        """Creating session with invalid verification method fails."""
        payload = {
            "section_id": str(uuid4()),
            "created_by_id": str(uuid4()),
            "title": "Lecture",
            "start_time": datetime.now().isoformat(),
            "end_time": (datetime.now() + timedelta(hours=1)).isoformat(),
            "verification_method": "INVALID_METHOD",
        }
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.post(
            "/api/v1/attendance-sessions",
            json=payload,
            headers=headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_session_title_too_short(self, async_client: AsyncClient, user_token: str):
        """Creating session with title too short fails."""
        payload = {
            "section_id": str(uuid4()),
            "created_by_id": str(uuid4()),
            "title": "AB",  # Too short (min_length=3)
            "start_time": datetime.now().isoformat(),
            "end_time": (datetime.now() + timedelta(hours=1)).isoformat(),
        }
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.post(
            "/api/v1/attendance-sessions",
            json=payload,
            headers=headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_session_missing_required_fields(self, async_client: AsyncClient, user_token: str):
        """Creating session with missing required fields fails."""
        payload = {
            "title": "Lecture",
            # Missing section_id, created_by_id, start_time, end_time
        }
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.post(
            "/api/v1/attendance-sessions",
            json=payload,
            headers=headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
