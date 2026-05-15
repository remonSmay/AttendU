"""
Integration tests for course endpoints.

Tests cover:
- Creating courses with admin access only
- Listing and searching courses
- Getting individual course details
- Updating course information
- Deleting courses
- Error cases (unauthorized, not found, duplicate, validation)
- Authorization checks
"""

import pytest
from httpx import AsyncClient
from fastapi import status
from uuid import uuid4


class TestCourseCreation:
    """Tests for POST /api/v1/courses"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_course_as_admin(self, async_client: AsyncClient, admin_token: str):
        """Admin can create a new course."""
        payload = {
            "course_name": "Introduction to Python",
            "course_code": "CS101",
        }
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await async_client.post("/api/v1/courses", json=payload, headers=headers)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["course_name"] == "Introduction to Python"
        assert data["course_code"] == "CS101"
        assert "id" in data
        assert "created_at" in data

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_course_requires_admin(self, async_client: AsyncClient, user_token: str):
        """Non-admin user cannot create a course."""
        payload = {
            "course_name": "Advanced Python",
            "course_code": "CS201",
        }
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.post("/api/v1/courses", json=payload, headers=headers)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_courses_empty(self, async_client: AsyncClient, user_token: str):
        """Can list courses when none exist."""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.get("/api/v1/courses", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_list_courses_requires_auth(self, async_client: AsyncClient):
        """Listing courses requires authentication."""
        response = await async_client.get("/api/v1/courses")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_course_invalid_name_too_short(self, async_client: AsyncClient, admin_token: str):
        """Creating course with invalid name fails."""
        payload = {
            "course_name": "X",  # Too short (min_length=2)
            "course_code": "CS999",
        }
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await async_client.post("/api/v1/courses", json=payload, headers=headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_course_missing_required_fields(self, async_client: AsyncClient, admin_token: str):
        """Creating course with missing required fields fails."""
        payload = {
            "course_name": "Incomplete",
            # Missing course_code
        }
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = await async_client.post("/api/v1/courses", json=payload, headers=headers)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestCourseGet:
    """Tests for GET /api/v1/courses/{course_id}"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_course_by_id(self, async_client: AsyncClient, admin_token: str, user_token: str):
        """Can get course by ID."""
        # Create course as admin
        create_response = await async_client.post(
            "/api/v1/courses",
            json={
                "course_name": "Data Structures",
                "course_code": "CS202",
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        course_id = create_response.json()["id"]

        # Get course as user
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.get(f"/api/v1/courses/{course_id}", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == course_id
        assert data["course_code"] == "CS202"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_course_not_found(self, async_client: AsyncClient, user_token: str):
        """Getting non-existent course returns 404."""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = await async_client.get(f"/api/v1/courses/{uuid4()}", headers=headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in response.json()["detail"]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_course_requires_auth(self, async_client: AsyncClient, admin_token: str):
        """Getting course requires authentication."""
        # Create course as admin
        create_response = await async_client.post(
            "/api/v1/courses",
            json={
                "course_name": "Algorithms",
                "course_code": "CS301",
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        course_id = create_response.json()["id"]

        # Try to get without auth
        response = await async_client.get(f"/api/v1/courses/{course_id}")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCourseUpdate:
    """Tests for PUT /api/v1/courses/{course_id}"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_update_course_as_admin(self, async_client: AsyncClient, admin_token: str):
        """Admin can update course information."""
        # Create course
        create_response = await async_client.post(
            "/api/v1/courses",
            json={
                "course_name": "Web Development",
                "course_code": "CS401",
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        course_id = create_response.json()["id"]

        # Update course
        update_payload = {
            "course_name": "Advanced Web Development",
            "course_code": "CS401-ADV",
        }
        response = await async_client.put(
            f"/api/v1/courses/{course_id}",
            json=update_payload,
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["course_name"] == "Advanced Web Development"
        assert data["course_code"] == "CS401-ADV"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_update_course_requires_admin(self, async_client: AsyncClient, admin_token: str, user_token: str):
        """Non-admin cannot update course."""
        # Create course as admin
        create_response = await async_client.post(
            "/api/v1/courses",
            json={
                "course_name": "Database Design",
                "course_code": "CS501",
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        course_id = create_response.json()["id"]

        # Try to update as non-admin
        response = await async_client.put(
            f"/api/v1/courses/{course_id}",
            json={"course_name": "Updated"},
            headers={"Authorization": f"Bearer {user_token}"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_update_course_not_found(self, async_client: AsyncClient, admin_token: str):
        """Updating non-existent course returns 404."""
        response = await async_client.put(
            f"/api/v1/courses/{uuid4()}",
            json={"course_name": "Updated"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCourseDelete:
    """Tests for DELETE /api/v1/courses/{course_id}"""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_delete_course_as_admin(self, async_client: AsyncClient, admin_token: str):
        """Admin can delete a course."""
        # Create course
        create_response = await async_client.post(
            "/api/v1/courses",
            json={
                "course_name": "Networking",
                "course_code": "CS601",
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        course_id = create_response.json()["id"]

        # Delete course
        response = await async_client.delete(
            f"/api/v1/courses/{course_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify course is deleted
        response = await async_client.get(
            f"/api/v1/courses/{course_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_delete_course_requires_admin(self, async_client: AsyncClient, admin_token: str, user_token: str):
        """Non-admin cannot delete course."""
        # Create course as admin
        create_response = await async_client.post(
            "/api/v1/courses",
            json={
                "course_name": "Machine Learning",
                "course_code": "CS701",
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        course_id = create_response.json()["id"]

        # Try to delete as non-admin
        response = await async_client.delete(
            f"/api/v1/courses/{course_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_delete_course_not_found(self, async_client: AsyncClient, admin_token: str):
        """Deleting non-existent course returns 404."""
        response = await async_client.delete(
            f"/api/v1/courses/{uuid4()}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
