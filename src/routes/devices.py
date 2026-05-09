from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.crud.attendance_checkin_controller import attendance_checkin_controller
from controllers.crud.attendance_session_controller import attendance_session_controller
from controllers.crud.device_controller import device_controller
from helpers.database import async_get_db
from helpers.dependencies import get_current_user, ensure_admin
from Models import AttendanceSession, Student, User
from Models.schemas.attendance_event import AttendanceCheckInRequest
from Models.schemas.device import (
    DeviceActiveSessionResponse,
    DeviceCreate,
    DevicePingResponse,
    DeviceResponse,
    DeviceRFIDCheckinRequest,
    DeviceRFIDCheckinResponse,
    DeviceRFIDFaceCheckinRequest,
    DeviceRFIDFaceCheckinResponse,
    DeviceUpdate,
)
from services.face_recognition_service import capture_and_verify


router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_device(
    payload: DeviceCreate,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    try:
        return await device_controller.create_device(db, payload)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="device violates a uniqueness or foreign-key rule",
        ) from exc


@router.get("", response_model=list[DeviceResponse])
async def list_devices(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    return await device_controller.list_all(db, offset=offset, limit=limit)


@router.post("/checkin", response_model=DeviceRFIDCheckinResponse)
async def device_rfid_checkin(
    payload: DeviceRFIDCheckinRequest,
    db: AsyncSession = Depends(async_get_db),
):
    # Temporary no-auth mode for device bring-up; replace with X-Device-Key validation.
    student = await db.scalar(
        select(Student).where(Student.rfid_uid == payload.rfid_uid)
    )
    if not student:
        return DeviceRFIDCheckinResponse(
            accepted=False,
            student_name=None,
            reason="student not found for RFID",
        )

    session = await db.scalar(
        select(AttendanceSession).where(
            AttendanceSession.id == payload.attendance_session_id
        )
    )
    if not session:
        return DeviceRFIDCheckinResponse(
            accepted=False,
            student_name=student.full_name,
            reason="session not found",
        )

    checkin_payload = AttendanceCheckInRequest(
        student_id=student.id,
        attendance_session_id=payload.attendance_session_id,
        section_id=session.section_id,
        device_id=payload.device_id,
        method_used="RFID",
        similarity_score=None,
    )
    result = await attendance_checkin_controller.process_checkin(db, checkin_payload)

    return DeviceRFIDCheckinResponse(
        accepted=result.accepted,
        student_name=student.full_name,
        reason=result.reason,
    )


@router.post("/rfid-face-checkin", response_model=DeviceRFIDFaceCheckinResponse)
async def device_rfid_face_checkin(
    payload: DeviceRFIDFaceCheckinRequest,
    db: AsyncSession = Depends(async_get_db),
):
    """
    RFID + Face dual verification check-in.

    Flow:
      1. Validate session exists and is active
      2. Find student by rfid_uid (RFID verification)
      3. Verify student has a registered face
      4. Capture frame from webcam and compare with student's encoding (Face verification)
      5. If both pass → call process_checkin with method_used=RFID_FACE
    """
    # Step 1: Get session
    session = await db.scalar(
        select(AttendanceSession).where(
            AttendanceSession.id == payload.attendance_session_id
        )
    )
    if not session:
        return DeviceRFIDFaceCheckinResponse(
            accepted=False,
            rfid_verified=False,
            face_verified=False,
            reason="session not found",
        )

    if not session.is_active:
        return DeviceRFIDFaceCheckinResponse(
            accepted=False,
            rfid_verified=False,
            face_verified=False,
            reason="session is not active",
        )

    # Step 2: RFID verification
    student = await db.scalar(
        select(Student).where(Student.rfid_uid == payload.rfid_uid)
    )
    if not student:
        return DeviceRFIDFaceCheckinResponse(
            accepted=False,
            rfid_verified=False,
            face_verified=False,
            reason="no student found for this RFID card",
        )

    # Step 3: Check student has a registered face
    if not student.face_reference_image:
        return DeviceRFIDFaceCheckinResponse(
            accepted=False,
            student_name=student.full_name,
            rfid_verified=True,
            face_verified=False,
            reason="student has no registered face photo",
        )

    # Step 4: Face verification via webcam
    try:
        matched, similarity, _ = await capture_and_verify(
            student_id=student.id,
            camera_index=payload.camera_index,
        )
    except RuntimeError as exc:
        # Webcam hardware error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Webcam error: {str(exc)}",
        ) from exc
    except ValueError as exc:
        return DeviceRFIDFaceCheckinResponse(
            accepted=False,
            student_name=student.full_name,
            rfid_verified=True,
            face_verified=False,
            reason=str(exc),
        )

    if not matched:
        return DeviceRFIDFaceCheckinResponse(
            accepted=False,
            student_name=student.full_name,
            rfid_verified=True,
            face_verified=False,
            similarity_score=round(similarity, 3),
            reason=f"face verification failed (similarity: {similarity:.2%})",
        )

    # Step 5: Both verified → process check-in
    checkin_payload = AttendanceCheckInRequest(
        student_id=student.id,
        attendance_session_id=payload.attendance_session_id,
        section_id=session.section_id,
        device_id=payload.device_id,
        method_used="RFID_FACE",
        similarity_score=similarity,
    )
    result = await attendance_checkin_controller.process_checkin(db, checkin_payload)

    return DeviceRFIDFaceCheckinResponse(
        accepted=result.accepted,
        student_name=student.full_name,
        rfid_verified=True,
        face_verified=matched,
        similarity_score=round(similarity, 3),
        reason=result.reason,
    )


@router.get("/{device_id}/ping", response_model=DevicePingResponse)
async def ping_device(
    device_id: UUID,
    db: AsyncSession = Depends(async_get_db),
):
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        return DevicePingResponse(
            online=False,
            device_id=device_id,
            device_name=None,
            section_id=None,
            message="device not registered",
        )

    return DevicePingResponse(
        online=True,
        device_id=device.id,
        device_name=device.device_name,
        section_id=device.section_id,
        message="device recognized",
    )


@router.get(
    "/{device_id}/active-session", response_model=DeviceActiveSessionResponse
)
async def get_active_session_for_device(
    device_id: UUID,
    db: AsyncSession = Depends(async_get_db),
):
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        return DeviceActiveSessionResponse(
            session_found=False,
            session_id=None,
            title=None,
            section_id=None,
            start_time=None,
            end_time=None,
            reason="device not registered",
        )

    if device.section_id is None:
        return DeviceActiveSessionResponse(
            session_found=False,
            session_id=None,
            title=None,
            section_id=None,
            start_time=None,
            end_time=None,
            reason="device not assigned to section",
        )

    session = await attendance_session_controller.get_active_for_section(
        db, device.section_id
    )
    if not session:
        return DeviceActiveSessionResponse(
            session_found=False,
            session_id=None,
            title=None,
            section_id=None,
            start_time=None,
            end_time=None,
            reason=None,
        )

    return DeviceActiveSessionResponse(
        session_found=True,
        session_id=session.id,
        title=session.title,
        section_id=session.section_id,
        start_time=session.start_time,
        end_time=session.end_time,
        verification_method=session.verification_method,
        reason=None,
    )


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: UUID,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="device not found"
        )
    return device


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: UUID,
    payload: DeviceUpdate,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="device not found"
        )

    try:
        return await device_controller.update_device(db, device, payload)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="device violates a uniqueness or foreign-key rule",
        ) from exc


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: UUID,
    db: AsyncSession = Depends(async_get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_admin(current_user)
    device = await device_controller.get_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="device not found"
        )
    await device_controller.delete(db, device)

