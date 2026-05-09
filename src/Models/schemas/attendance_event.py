from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field

from Models.schemas.base import ORMModel, TimestampedResponse


AttendanceMethod = Literal["RFID", "FACE", "MANUAL", "RFID_FACE"]
AttendanceStatus = Literal["Present", "Absent", "Late"]


class AttendanceCheckInRequest(ORMModel):
    student_id: UUID
    attendance_session_id: UUID
    section_id: UUID
    device_id: UUID
    method_used: AttendanceMethod
    similarity_score: float | None = Field(default=None, ge=0.0, le=1.0)


class AttendanceEventResponse(TimestampedResponse):
    student_id: UUID
    attendance_session_id: UUID
    section_id: UUID
    device_id: UUID
    method_used: AttendanceMethod
    final_status: AttendanceStatus


class AttendanceValidationResult(ORMModel):
    accepted: bool
    reason: str
    attendance_event: AttendanceEventResponse | None = None
    checked_at: datetime
