from sqlalchemy import Enum, ForeignKey, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from helpers.database import Base
from Models.base_data_model import BaseDataModel


class AuditLog(Base, BaseDataModel):
    __tablename__ = "audit_logs"

    actor_user_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    event_type: Mapped[str] = mapped_column(
        Enum(
            "session_opened",
            "session_closed",
            "checkin_success",
            "checkin_failed",
            "fraud_attempt",
            name="audit_event_type",
        ),
        nullable=False,
    )
    action_source: Mapped[str] = mapped_column(
        Enum("device", "api", "system", name="audit_action_source"),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    actor_user = relationship("User", back_populates="audit_logs")
