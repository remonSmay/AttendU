from datetime import datetime
from uuid import UUID

from pydantic import Field

from Models.schemas.base import ORMModel, TimestampedResponse


class DeviceCreate(ORMModel):
    device_name: str = Field(min_length=2, max_length=100)
    location: str | None = Field(default=None, max_length=100)
    section_id: UUID | None = None


class DeviceUpdate(ORMModel):
    device_name: str | None = Field(default=None, min_length=2, max_length=100)
    location: str | None = Field(default=None, max_length=100)
    section_id: UUID | None = None


class DeviceResponse(TimestampedResponse):
    device_name: str
    location: str | None
    section_id: UUID | None


class DeviceRFIDCheckinRequest(ORMModel):
    device_id: UUID
    rfid_uid: str = Field(min_length=1, max_length=50)
    attendance_session_id: UUID


class DeviceRFIDCheckinResponse(ORMModel):
    accepted: bool
    student_name: str | None = None
    reason: str


class DeviceRFIDFaceCheckinRequest(ORMModel):
    device_id: UUID
    rfid_uid: str = Field(min_length=1, max_length=50)
    attendance_session_id: UUID
    camera_index: int = Field(default=0, ge=0, le=10)


class DeviceRFIDFaceCheckinResponse(ORMModel):
    accepted: bool
    student_name: str | None = None
    rfid_verified: bool
    face_verified: bool
    similarity_score: float | None = None
    reason: str


class DevicePingResponse(ORMModel):
    online: bool
    device_id: UUID
    device_name: str | None = None
    section_id: UUID | None = None
    message: str


class DeviceActiveSessionResponse(ORMModel):
    session_found: bool
    session_id: UUID | None = None
    title: str | None = None
    section_id: UUID | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    verification_method: str | None = None
    reason: str | None = None

