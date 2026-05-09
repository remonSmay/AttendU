import re
from uuid import UUID

from pydantic import Field, field_validator

from Models.schemas.base import ORMModel, TimestampedResponse

VALID_DAYS = {
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
    "FRIDAY", "SATURDAY", "SUNDAY",
}

SCHEDULE_PATTERN = re.compile(
    r"^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY) \d{2}:\d{2}$"
)


def _validate_schedule(value: str) -> str:
    value = value.strip().upper()
    if not SCHEDULE_PATTERN.match(value):
        raise ValueError(
            "schedule_time must be in format 'DAY HH:MM' "
            "(e.g. 'MONDAY 09:00')"
        )
    return value


class SectionCreate(ORMModel):
    course_id: UUID
    instructor_id: UUID
    section_name: str = Field(min_length=2, max_length=50)
    schedule_time: str = Field(
        examples=["MONDAY 09:00"],
        description="Weekly schedule: DAY HH:MM (e.g. 'TUESDAY 14:30')",
    )

    @field_validator("schedule_time")
    @classmethod
    def validate_schedule_time(cls, v: str) -> str:
        return _validate_schedule(v)


class SectionUpdate(ORMModel):
    course_id: UUID | None = None
    instructor_id: UUID | None = None
    section_name: str | None = Field(default=None, min_length=2, max_length=50)
    schedule_time: str | None = Field(default=None)

    @field_validator("schedule_time")
    @classmethod
    def validate_schedule_time(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _validate_schedule(v)


class SectionResponse(TimestampedResponse):
    course_id: UUID
    instructor_id: UUID
    section_name: str
    schedule_time: str
