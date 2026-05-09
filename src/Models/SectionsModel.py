from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from helpers.database import Base
from Models.base_data_model import BaseDataModel


class Section(Base, BaseDataModel):
    __tablename__ = "sections"

    course_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    instructor_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    section_name: Mapped[str] = mapped_column(String(50), nullable=False)
    schedule_time: Mapped[str] = mapped_column(
        String(20), nullable=False
    )

    course = relationship("Course", back_populates="sections")
    instructor = relationship("User", back_populates="sections")
    enrollments = relationship(
        "Enrollment", back_populates="section", cascade="all, delete-orphan"
    )
    attendance_sessions = relationship(
        "AttendanceSession", back_populates="section", cascade="all, delete-orphan"
    )
    attendance_events = relationship(
        "AttendanceEvent", back_populates="section", cascade="all, delete-orphan"
    )
