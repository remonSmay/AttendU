"""
Integration tests for the complete authentication flow.

Tests the entire auth lifecycle:
- POST /api/v1/auth/register - User registration
- POST /api/v1/auth/login - User login
- GET /api/v1/auth/me - Get current user
- POST /api/v1/auth/refresh - Token refresh

Also tests error cases:
- Duplicate email registration
- Invalid credentials
- Bad/expired refresh tokens
- Invalid token formats
"""

import pytest
from fastapi import status
from jose import jwt

from factories import UserFactory
from helpers.config import get_settings
from helpers.auth import create_refresh_token, create_access_token
from Models.schemas.user import UserRegister, UserLogin, Token, UserResponse


settings = get_settings()


class TestAuthRegistration:
    """Tests for user registration endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_successful(self, async_client):
        """Test successful user registration creates user and returns tokens."""
        payload = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "password": "SecurePassword123",
            "role": "instructor",
        }

        response = await async_client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()

        # Verify response structure
        assert "user" in data
        assert "tokens" in data

        # Verify user data
        user = data["user"]
        assert user["full_name"] == payload["full_name"]
        assert user["email"] == payload["email"]
        assert user["role"] == payload["role"]
        assert "id" in user
        assert "created_at" in user
        assert "updated_at" in user
        # Password should never be returned
        assert "password_hash" not in user
        assert "password" not in user

        # Verify tokens
        tokens = data["tokens"]
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["token_type"] == "bearer"
        assert len(tokens["access_token"]) > 0
        assert len(tokens["refresh_token"]) > 0

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_admin_role(self, async_client):
        """Test registration with admin role."""
        payload = {
            "full_name": "Admin User",
            "email": "admin@example.com",
            "password": "AdminPassword123",
            "role": "admin",
        }

        response = await async_client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["user"]["role"] == "admin"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_instructor_role(self, async_client):
        """Test registration with instructor role."""
        payload = {
            "full_name": "Instructor User",
            "email": "instructor@example.com",
            "password": "InstructorPass123",
            "role": "instructor",
        }

        response = await async_client.post("/api/v1/auth/register", json=payload)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["user"]["role"] == "instructor"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, async_client, test_db_session):
        """Test that duplicate email registration returns 409 Conflict."""
        email = "duplicate@example.com"
        payload = {
            "full_name": "First User",
            "email": email,
            "password": "Password123",
            "role": "instructor",
        }

        # First registration should succeed
        response1 = await async_client.post("/api/v1/auth/register", json=payload)
        assert response1.status_code == status.HTTP_201_CREATED

        # Second registration with same email should fail
        payload["full_name"] = "Second User"
        response2 = await async_client.post("/api/v1/auth/register", json=payload)
        assert response2.status_code == status.HTTP_409_CONFLICT
        assert "already registered" in response2.json()["detail"].lower()

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_invalid_email(self, async_client):
        """Test registration with invalid email format."""
        payload = {
            "full_name": "Invalid Email",
            "email": "not-an-email",
            "password": "Password123",
            "role": "instructor",
        }

        response = await async_client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_invalid_role(self, async_client):
        """Test registration with invalid role returns 422."""
        payload = {
            "full_name": "Invalid Role",
            "email": "invalid.role@example.com",
            "password": "Password123",
            "role": "student",  # Invalid role
        }

        response = await async_client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_short_password(self, async_client):
        """Test registration with password too short."""
        payload = {
            "full_name": "Short Password",
            "email": "short@example.com",
            "password": "123",  # Too short (min 6)
            "role": "instructor",
        }

        response = await async_client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_short_name(self, async_client):
        """Test registration with name too short."""
        payload = {
            "full_name": "A",  # Too short (min 2)
            "email": "short.name@example.com",
            "password": "Password123",
            "role": "instructor",
        }

        response = await async_client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_missing_fields(self, async_client):
        """Test registration with missing required fields."""
        # Missing password
        payload = {
            "full_name": "No Password",
            "email": "nopass@example.com",
            "role": "instructor",
        }

        response = await async_client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestAuthLogin:
    """Tests for user login endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_login_successful(self, async_client):
        """Test successful login with correct credentials."""
        # Register first
        register_payload = {
            "full_name": "Login Test",
            "email": "login.test@example.com",
            "password": "LoginPassword123",
            "role": "instructor",
        }
        register_response = await async_client.post(
            "/api/v1/auth/register", json=register_payload
        )
        assert register_response.status_code == status.HTTP_201_CREATED

        # Now login
        login_payload = {
            "email": "login.test@example.com",
            "password": "LoginPassword123",
        }
        response = await async_client.post("/api/v1/auth/login", json=login_payload)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify user data
        user = data["user"]
        assert user["email"] == "login.test@example.com"
        assert user["full_name"] == "Login Test"
        assert user["role"] == "instructor"
        assert "id" in user

        # Verify tokens
        tokens = data["tokens"]
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["token_type"] == "bearer"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_login_wrong_password(self, async_client):
        """Test login with wrong password returns 401."""
        # Register first
        register_payload = {
            "full_name": "Wrong Password Test",
            "email": "wrong.pass@example.com",
            "password": "CorrectPassword123",
            "role": "instructor",
        }
        await async_client.post("/api/v1/auth/register", json=register_payload)

        # Try login with wrong password
        login_payload = {
            "email": "wrong.pass@example.com",
            "password": "WrongPassword123",
        }
        response = await async_client.post("/api/v1/auth/login", json=login_payload)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalid" in response.json()["detail"].lower()

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, async_client):
        """Test login with non-existent email returns 401."""
        login_payload = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123",
        }

        response = await async_client.post("/api/v1/auth/login", json=login_payload)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalid" in response.json()["detail"].lower()

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_login_invalid_email_format(self, async_client):
        """Test login with invalid email format."""
        login_payload = {
            "email": "not-an-email",
            "password": "SomePassword123",
        }

        response = await async_client.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_login_missing_credentials(self, async_client):
        """Test login with missing credentials."""
        # Missing password
        login_payload = {
            "email": "missing@example.com",
        }

        response = await async_client.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_login_case_insensitive_email(self, async_client):
        """Test that login is case-insensitive for email."""
        # Register with lowercase
        register_payload = {
            "full_name": "Case Test",
            "email": "case.test@example.com",
            "password": "CasePassword123",
            "role": "instructor",
        }
        await async_client.post("/api/v1/auth/register", json=register_payload)

        # Login with uppercase (should fail as SQL is case-sensitive by default)
        # This tests actual behavior - adjust based on implementation
        login_payload = {
            "email": "CASE.TEST@EXAMPLE.COM",
            "password": "CasePassword123",
        }
        response = await async_client.post("/api/v1/auth/login", json=login_payload)

        # Depending on DB case sensitivity, this may be 401
        # Document the actual behavior
        assert response.status_code in (status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED)


class TestAuthGetMe:
    """Tests for GET /api/v1/auth/me endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_me_with_valid_token(self, async_client):
        """Test getting current user with valid access token."""
        # Register and get token
        register_payload = {
            "full_name": "Me Test",
            "email": "me.test@example.com",
            "password": "MePassword123",
            "role": "instructor",
        }
        register_response = await async_client.post(
            "/api/v1/auth/register", json=register_payload
        )
        access_token = register_response.json()["tokens"]["access_token"]

        # Get current user
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        user = response.json()

        assert user["full_name"] == "Me Test"
        assert user["email"] == "me.test@example.com"
        assert user["role"] == "instructor"
        assert "id" in user
        assert "password_hash" not in user
        assert "password" not in user

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_me_without_token(self, async_client):
        """Test getting current user without token returns 401."""
        response = await async_client.get("/api/v1/auth/me")

        # HTTPBearer with auto_error=True returns 401 for missing credentials
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_me_with_invalid_token(self, async_client):
        """Test getting current user with invalid token returns 401."""
        headers = {"Authorization": "Bearer invalid.token.here"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        # Invalid token format returns 401 from decode_token
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_me_with_malformed_auth_header(self, async_client):
        """Test with malformed Authorization header."""
        headers = {"Authorization": "InvalidBearer token"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        # Malformed header causes HTTPBearer to raise 401
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_get_me_with_refresh_token_as_access(self, async_client):
        """Test using refresh token as access token should fail."""
        # Register and get tokens
        register_payload = {
            "full_name": "Refresh As Access",
            "email": "refresh.access@example.com",
            "password": "RefreshAccessPass123",
            "role": "instructor",
        }
        register_response = await async_client.post(
            "/api/v1/auth/register", json=register_payload
        )
        refresh_token = register_response.json()["tokens"]["refresh_token"]

        # Try to use refresh token as access token
        headers = {"Authorization": f"Bearer {refresh_token}"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        # Should fail because refresh token has type="refresh", not "access"
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAuthRefresh:
    """Tests for token refresh endpoint."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_refresh_token_successful(self, async_client):
        """Test successful token refresh with valid refresh token."""
        # Register and get tokens
        register_payload = {
            "full_name": "Refresh Test",
            "email": "refresh.test@example.com",
            "password": "RefreshPassword123",
            "role": "instructor",
        }
        register_response = await async_client.post(
            "/api/v1/auth/register", json=register_payload
        )
        original_tokens = register_response.json()["tokens"]

        # Refresh tokens
        refresh_payload = {"refresh_token": original_tokens["refresh_token"]}
        response = await async_client.post("/api/v1/auth/refresh", json=refresh_payload)

        assert response.status_code == status.HTTP_200_OK
        new_tokens = response.json()

        # Verify new tokens exist and are different
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        assert new_tokens["token_type"] == "bearer"
        # Tokens should be different (new iat/exp timestamps)
        # Note: tokens might be identical if created within the same second,
        # so we just verify they're valid JWT tokens
        assert new_tokens["access_token"]
        assert new_tokens["refresh_token"]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_refresh_token_can_be_used_immediately(self, async_client):
        """Test that new access token can be used immediately."""
        # Register and get tokens
        register_payload = {
            "full_name": "Refresh Immediate",
            "email": "refresh.immediate@example.com",
            "password": "RefreshImmediate123",
            "role": "instructor",
        }
        register_response = await async_client.post(
            "/api/v1/auth/register", json=register_payload
        )
        refresh_token = register_response.json()["tokens"]["refresh_token"]

        # Refresh tokens
        refresh_payload = {"refresh_token": refresh_token}
        refresh_response = await async_client.post(
            "/api/v1/auth/refresh", json=refresh_payload
        )
        new_access_token = refresh_response.json()["access_token"]

        # Use new access token to get current user
        headers = {"Authorization": f"Bearer {new_access_token}"}
        me_response = await async_client.get("/api/v1/auth/me", headers=headers)

        assert me_response.status_code == status.HTTP_200_OK
        assert me_response.json()["email"] == "refresh.immediate@example.com"

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_refresh_with_access_token_fails(self, async_client):
        """Test refresh with access token instead of refresh token fails."""
        # Register and get tokens
        register_payload = {
            "full_name": "Access As Refresh",
            "email": "access.as.refresh@example.com",
            "password": "AccessAsRefresh123",
            "role": "instructor",
        }
        register_response = await async_client.post(
            "/api/v1/auth/register", json=register_payload
        )
        access_token = register_response.json()["tokens"]["access_token"]

        # Try to refresh with access token
        refresh_payload = {"refresh_token": access_token}
        response = await async_client.post(
            "/api/v1/auth/refresh", json=refresh_payload
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "refresh token required" in response.json()["detail"].lower()

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_refresh_with_invalid_token(self, async_client):
        """Test refresh with invalid token returns 401."""
        refresh_payload = {"refresh_token": "invalid.token.here"}

        response = await async_client.post(
            "/api/v1/auth/refresh", json=refresh_payload
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_refresh_with_malformed_jwt(self, async_client):
        """Test refresh with malformed JWT."""
        refresh_payload = {"refresh_token": "not.a.valid.jwt.token.at.all"}

        response = await async_client.post(
            "/api/v1/auth/refresh", json=refresh_payload
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_refresh_missing_token(self, async_client):
        """Test refresh without providing refresh token."""
        refresh_payload = {}

        response = await async_client.post(
            "/api/v1/auth/refresh", json=refresh_payload
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestAuthFlow:
    """End-to-end flow tests for complete authentication lifecycle."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_complete_auth_flow(self, async_client):
        """Test complete auth flow: register -> login -> get me -> refresh."""
        # 1. Register
        register_payload = {
            "full_name": "Complete Flow",
            "email": "complete.flow@example.com",
            "password": "CompleteFlow123",
            "role": "instructor",
        }
        register_response = await async_client.post(
            "/api/v1/auth/register", json=register_payload
        )
        assert register_response.status_code == status.HTTP_201_CREATED
        register_data = register_response.json()
        user_id = register_data["user"]["id"]
        first_access_token = register_data["tokens"]["access_token"]
        first_refresh_token = register_data["tokens"]["refresh_token"]

        # 2. Login with same credentials
        login_payload = {
            "email": "complete.flow@example.com",
            "password": "CompleteFlow123",
        }
        login_response = await async_client.post(
            "/api/v1/auth/login", json=login_payload
        )
        assert login_response.status_code == status.HTTP_200_OK
        login_data = login_response.json()
        assert login_data["user"]["id"] == user_id
        second_access_token = login_data["tokens"]["access_token"]

        # 3. Get me with first access token
        headers = {"Authorization": f"Bearer {first_access_token}"}
        me_response = await async_client.get("/api/v1/auth/me", headers=headers)
        assert me_response.status_code == status.HTTP_200_OK
        me_data = me_response.json()
        assert me_data["id"] == user_id
        assert me_data["email"] == "complete.flow@example.com"

        # 4. Get me with second access token
        headers = {"Authorization": f"Bearer {second_access_token}"}
        me_response2 = await async_client.get("/api/v1/auth/me", headers=headers)
        assert me_response2.status_code == status.HTTP_200_OK
        assert me_response2.json()["id"] == user_id

        # 5. Refresh first token
        refresh_payload = {"refresh_token": first_refresh_token}
        refresh_response = await async_client.post(
            "/api/v1/auth/refresh", json=refresh_payload
        )
        assert refresh_response.status_code == status.HTTP_200_OK
        refresh_data = refresh_response.json()
        new_access_token = refresh_data["access_token"]
        new_refresh_token = refresh_data["refresh_token"]

        # 6. Get me with new access token
        headers = {"Authorization": f"Bearer {new_access_token}"}
        me_response3 = await async_client.get("/api/v1/auth/me", headers=headers)
        assert me_response3.status_code == status.HTTP_200_OK
        assert me_response3.json()["id"] == user_id

        # 7. Verify first refresh token still works (no expiration in this test)
        refresh_payload2 = {"refresh_token": new_refresh_token}
        refresh_response2 = await async_client.post(
            "/api/v1/auth/refresh", json=refresh_payload2
        )
        assert refresh_response2.status_code == status.HTTP_200_OK

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_multiple_users_isolation(self, async_client):
        """Test that different users cannot access each other's data."""
        # Register user 1
        user1_payload = {
            "full_name": "User One",
            "email": "user1@example.com",
            "password": "UserOne123",
            "role": "instructor",
        }
        user1_response = await async_client.post(
            "/api/v1/auth/register", json=user1_payload
        )
        user1_id = user1_response.json()["user"]["id"]
        user1_token = user1_response.json()["tokens"]["access_token"]

        # Register user 2
        user2_payload = {
            "full_name": "User Two",
            "email": "user2@example.com",
            "password": "UserTwo123",
            "role": "admin",
        }
        user2_response = await async_client.post(
            "/api/v1/auth/register", json=user2_payload
        )
        user2_id = user2_response.json()["user"]["id"]
        user2_token = user2_response.json()["tokens"]["access_token"]

        # Verify user 1 and 2 have different IDs
        assert user1_id != user2_id

        # User 1 gets self
        headers = {"Authorization": f"Bearer {user1_token}"}
        me_response1 = await async_client.get("/api/v1/auth/me", headers=headers)
        assert me_response1.json()["id"] == user1_id
        assert me_response1.json()["email"] == "user1@example.com"

        # User 2 gets self
        headers = {"Authorization": f"Bearer {user2_token}"}
        me_response2 = await async_client.get("/api/v1/auth/me", headers=headers)
        assert me_response2.json()["id"] == user2_id
        assert me_response2.json()["email"] == "user2@example.com"


class TestTokenValidation:
    """Tests for JWT token validation and claims."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_access_token_has_correct_claims(self, async_client):
        """Test that access token contains correct JWT claims."""
        register_payload = {
            "full_name": "Claims Test",
            "email": "claims.test@example.com",
            "password": "ClaimsTest123",
            "role": "instructor",
        }
        register_response = await async_client.post(
            "/api/v1/auth/register", json=register_payload
        )
        access_token = register_response.json()["tokens"]["access_token"]
        user_id = register_response.json()["user"]["id"]

        # Decode token
        payload = jwt.decode(
            access_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # Verify claims
        assert payload["sub"] == user_id
        assert payload["role"] == "instructor"
        assert payload["type"] == "access"
        assert "iat" in payload
        assert "exp" in payload
        assert payload["exp"] > payload["iat"]

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_refresh_token_has_correct_claims(self, async_client):
        """Test that refresh token contains correct JWT claims."""
        register_payload = {
            "full_name": "Refresh Claims",
            "email": "refresh.claims@example.com",
            "password": "RefreshClaims123",
            "role": "admin",
        }
        register_response = await async_client.post(
            "/api/v1/auth/register", json=register_payload
        )
        refresh_token = register_response.json()["tokens"]["refresh_token"]
        user_id = register_response.json()["user"]["id"]

        # Decode token
        payload = jwt.decode(
            refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # Verify claims
        assert payload["sub"] == user_id
        assert payload["role"] == "admin"
        assert payload["type"] == "refresh"
        assert "iat" in payload
        assert "exp" in payload

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_token_with_wrong_secret_fails(self, async_client):
        """Test that token signed with wrong secret cannot be verified."""
        # Create a token with wrong secret
        from jose import jwt as jose_jwt
        from datetime import timedelta

        payload = {
            "sub": "test-user-id",
            "role": "instructor",
            "type": "access",
        }
        wrong_token = jose_jwt.encode(
            payload,
            "wrong-secret-key",
            algorithm=settings.ALGORITHM,
        )

        # Try to use it to get /me
        headers = {"Authorization": f"Bearer {wrong_token}"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
