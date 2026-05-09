from sqlalchemy import Enum, ForeignKey, String, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from helpers.database import Base
from Models.base_data_model import BaseDataModel


class Device(Base, BaseDataModel):
    __tablename__ = "devices"

    device_name: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    
    section_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sections.id", ondelete="SET NULL"),
        nullable=True,
    )
    attendance_events = relationship("AttendanceEvent", back_populates="device")


class AttendanceEvent(Base, BaseDataModel):
    __tablename__ = "attendance_events"
    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "attendance_session_id",
            name="uq_attendance_student_session",
        ),
    )

    student_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
    )
    attendance_session_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("attendance_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    section_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sections.id", ondelete="CASCADE"),
        nullable=False,
    )
    device_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="RESTRICT"),
        nullable=False,
    )

    method_used: Mapped[str] = mapped_column(
        Enum("RFID", "FACE", "MANUAL", "RFID_FACE", name="attendance_method"),
        nullable=False,
    )
    final_status: Mapped[str] = mapped_column(
        Enum("Present", "Absent", "Late", name="attendance_status"),
        nullable=False,
    )

    student = relationship("Student", back_populates="attendance_events")
    attendance_session = relationship(
        "AttendanceSession",
        back_populates="attendance_events",
    )
    section = relationship("Section", back_populates="attendance_events")
    device = relationship("Device", back_populates="attendance_events")


Index("idx_attendance_student", AttendanceEvent.student_id)
Index("idx_attendance_section", AttendanceEvent.section_id)
Index("idx_attendance_timestamp", AttendanceEvent.created_at)
