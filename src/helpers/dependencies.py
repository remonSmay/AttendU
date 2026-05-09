from typing import Iterable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from Models import Section, AttendanceSession, User
from helpers.auth import decode_token
from helpers.database import async_get_db


bearer_scheme = HTTPBearer(auto_error=True)


def _forbidden(detail: str = "not enough permissions") -> HTTPException:
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(async_get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid authentication credentials",
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="access token required",
        )

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token subject",
        )

    try:
        user_id = UUID(subject)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid token subject",
        ) from exc

    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user not found",
        )

    return user


class RequireRole:
    def __init__(self, roles: Iterable[str]):
        self.roles = set(roles)

    async def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.roles:
            raise _forbidden()
        return current_user


def ensure_admin(current_user: User) -> None:
    if current_user.role != "admin":
        raise _forbidden("admin role required")


def ensure_admin_or_instructor(current_user: User) -> None:
    if current_user.role not in {"admin", "instructor"}:
        raise _forbidden()


def ensure_admin_or_self(current_user: User, owner_user_id: UUID) -> None:
    if current_user.role == "admin":
        return
    if current_user.role == "instructor" and current_user.id == owner_user_id:
        return
    raise _forbidden("only admin or resource owner can perform this action")


async def ensure_section_access(
    db: AsyncSession,
    current_user: User,
    section_id: UUID,
    *,
    write: bool,
) -> None:
    if current_user.role == "admin":
        return

    if current_user.role != "instructor":
        raise _forbidden()

    section = await db.scalar(select(Section).where(Section.id == section_id))
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="section not found"
        )

    if section.instructor_id != current_user.id:
        if write:
            raise _forbidden("instructor can only modify owned sections")
        raise _forbidden("instructor can only view owned sections")


async def ensure_session_access(
    db: AsyncSession,
    current_user: User,
    session_id: UUID,
    *,
    write: bool,
) -> None:
    if current_user.role == "admin":
        return

    if current_user.role != "instructor":
        raise _forbidden()

    session = await db.scalar(
        select(AttendanceSession).where(AttendanceSession.id == session_id)
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="session not found"
        )

    if session.created_by_id != current_user.id:
        if write:
            raise _forbidden("instructor can only modify owned sessions")
        raise _forbidden("instructor can only view owned sessions")
