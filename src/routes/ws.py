from uuid import UUID

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select

from Models import User
from helpers.auth import decode_token
from helpers.database import AsyncSessionLocal
from helpers.dependencies import ensure_session_access
from helpers.ws_manager import ws_manager


router = APIRouter(prefix="/ws", tags=["ws"])


async def _authenticate_websocket(session_id: UUID, websocket: WebSocket) -> User:
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing access token",
        )

    try:
        payload = decode_token(token)
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

    async with AsyncSessionLocal() as db:
        user = await db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="user not found",
            )

        await ensure_session_access(db, user, session_id, write=False)

    return user


@router.websocket("/session/{session_id}")
async def attendance_session_ws(websocket: WebSocket, session_id: UUID):
    try:
        await _authenticate_websocket(session_id, websocket)
    except HTTPException as exc:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=exc.detail)
        return

    await ws_manager.connect(session_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(session_id, websocket)
    except Exception:
        ws_manager.disconnect(session_id, websocket)
