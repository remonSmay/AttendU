from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.auth_controller import auth_controller
from helpers.database import async_get_db
from helpers.dependencies import get_current_user
from Models import User
from Models.schemas.user import (
    AuthResponse,
    RefreshTokenRequest,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(async_get_db),
):
    try:
        return await auth_controller.register(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="email already registered"
        ) from exc


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(async_get_db),
):
    try:
        return await auth_controller.login(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=Token)
async def refresh(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(async_get_db),
):
    try:
        return await auth_controller.refresh(db, payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
