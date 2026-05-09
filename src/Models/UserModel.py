from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from helpers.database import Base
from Models.base_data_model import BaseDataModel


class User(Base, BaseDataModel):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[str] = mapped_column(
        Enum("admin", "instructor", name="user_roles"),
        nullable=False,
    )

    # This requires a Section model with: instructor_id FK -> users.id
    # and in Section: instructor = relationship("User", back_populates="sections")
    sections = relationship("Section", back_populates="instructor")
    attendance_sessions = relationship("AttendanceSession", back_populates="created_by")
    audit_logs = relationship("AuditLog", back_populates="actor_user")
