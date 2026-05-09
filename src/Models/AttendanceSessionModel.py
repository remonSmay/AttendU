from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from helpers.database import Base
from Models.base_data_model import BaseDataModel


class AttendanceSession(Base, BaseDataModel):
    __tablename__ = "attendance_sessions"

    section_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sections.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_by_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    verification_method: Mapped[str] = mapped_column(
        SAEnum("RFID", "FACE", "RFID_FACE", "MANUAL", name="session_verification_method"),
        nullable=False,
        server_default="RFID",
    )

    section = relationship("Section", back_populates="attendance_sessions")
    created_by = relationship("User", back_populates="attendance_sessions")
    attendance_events = relationship(
        "AttendanceEvent",
        back_populates="attendance_session",
        cascade="all, delete-orphan",
    )


Index(
    "uq_active_session_per_section",
    AttendanceSession.section_id,
    unique=True,
    postgresql_where=text("is_active = true"),
)
