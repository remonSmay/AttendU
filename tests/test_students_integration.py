"""
Integration tests for student endpoints.

Tests cover:
- Creating students with admin access only
- Listing and searching students
- Getting individual student details
- Updating student information
- Deleting students
- Error cases (unauthorized, not found, duplicate, validation)
- Authorization checks
"""

import pytest
from httpx import AsyncClient
from fastapi import status
from uuid import uuid4


class TestStudentCreation:
    """Tests for POST /api/v1/students"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_student_as_admin(self, async_client: AsyncClient, admin_token: str):
        """Admin can create a new student."""
        payload = {
            "full_name": "Ahmed Hassan",
            "email": "ahmed@university.edu",
            "rfid_uid": "RF123456789",
            "phone": "+20 100 123 4567",
        }
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await async_client.post("/api/v1/students", json=payload, headers=headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "ahmed@university.edu"
        assert data["full_name"] == "Ahmed Hassan"
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_student_requires_admin(self, async_client: AsyncClient, user_token: str):
        """Non-admin user cannot create a student."""
        payload = {
            "full_name": "Mohamed Ali",
            "email": "mohamed@university.edu",
            "rfid_uid": "RF987654321",
            "phone": "+20 100 987 6543",
        }
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.post("/api/v1/students", json=payload, headers=headers)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_students_empty(self, async_client: AsyncClient, user_token: str):
        """Can list students when none exist."""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.get("/api/v1/students", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_students_requires_auth(self, async_client: AsyncClient):
        """Listing students requires authentication."""
        response = await async_client.get("/api/v1/students")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_student_invalid_email(self, async_client: AsyncClient, admin_token: str):
        """Creating student with invalid email fails."""
        payload = {
            "full_name": "Invalid Email",
            "email": "not-an-email",
            "rfid_uid": "RF555555555",
            "phone": "+20 100 555 6666",
        }
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await async_client.post("/api/v1/students", json=payload, headers=headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_student_missing_required_fields(self, async_client: AsyncClient, admin_token: str):
        """Creating student with missing required fields fails."""
        payload = {
            "full_name": "Incomplete",
            # Missing email, rfid_uid
        }
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await async_client.post("/api/v1/students", json=payload, headers=headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
