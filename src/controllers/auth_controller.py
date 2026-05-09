from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from Models import User
from helpers.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from Models.schemas.user import (
    AuthResponse,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
)


class AuthController:
    async def register(self, db: AsyncSession, payload: UserRegister) -> AuthResponse:
        existing_user = await db.scalar(select(User).where(User.email == payload.email))
        if existing_user:
            raise ValueError("email already registered")

        user = User(
            full_name=payload.full_name,
            email=payload.email,
            password_hash=get_password_hash(payload.password),
            role=payload.role,
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        tokens = Token(
            access_token=create_access_token(str(user.id), user.role),
            refresh_token=create_refresh_token(str(user.id), user.role),
        )

        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def login(self, db: AsyncSession, payload: UserLogin) -> AuthResponse:
        user = await db.scalar(select(User).where(User.email == payload.email))
        if not user or not verify_password(payload.password, user.password_hash):
            raise ValueError("invalid email or password")

        tokens = Token(
            access_token=create_access_token(str(user.id), user.role),
            refresh_token=create_refresh_token(str(user.id), user.role),
        )
        return AuthResponse(user=UserResponse.model_validate(user), tokens=tokens)

    async def refresh(self, db: AsyncSession, refresh_token: str) -> Token:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise ValueError("refresh token required")

        subject = payload.get("sub")
        if not subject:
            raise ValueError("invalid token subject")

        try:
            user_id = UUID(subject)
        except ValueError as exc:
            raise ValueError("invalid token subject") from exc

        user = await db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise ValueError("user not found")

        return Token(
            access_token=create_access_token(str(user.id), user.role),
            refresh_token=create_refresh_token(str(user.id), user.role),
        )


auth_controller = AuthController()
