from datetime import datetime
from uuid import UUID

from Models.schemas.base import ORMModel


class AttendanceReportSessionSummary(ORMModel):
    id: UUID
    created_at: datetime
    updated_at: datetime
    section_id: UUID
    section_name: str
    course_id: UUID
    course_name: str
    course_code: str
    created_by_id: UUID
    title: str
    start_time: datetime
    end_time: datetime
    is_active: bool
    present_count: int
    total_students: int
    attendance_percentage: float
