"""add rfid_face method and session verification

Revision ID: d5e6f7a8b9c0
Revises: 00e4da358ca5
Create Date: 2026-05-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, Sequence[str], None] = "00e4da358ca5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extend the existing attendance_method enum with RFID_FACE
    # Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction in PostgreSQL
    # so we need to commit and use a non-transactional connection
    op.execute("ALTER TYPE attendance_method ADD VALUE IF NOT EXISTS 'RFID_FACE'")

    # 2. Create the new session_verification_method enum
    session_verification_enum = sa.Enum(
        "RFID", "FACE", "RFID_FACE", "MANUAL",
        name="session_verification_method",
    )
    session_verification_enum.create(op.get_bind(), checkfirst=True)

    # 3. Add verification_method column to attendance_sessions
    op.add_column(
        "attendance_sessions",
        sa.Column(
            "verification_method",
            sa.Enum("RFID", "FACE", "RFID_FACE", "MANUAL", name="session_verification_method"),
            nullable=False,
            server_default="RFID",
        ),
    )


def downgrade() -> None:
    # Drop the verification_method column
    op.drop_column("attendance_sessions", "verification_method")

    # Drop the session_verification_method enum type
    op.execute("DROP TYPE IF EXISTS session_verification_method")

    # Note: Cannot cleanly remove 'RFID_FACE' from attendance_method enum in PostgreSQL
    # ALTER TYPE ... DROP VALUE is not supported. The value will remain but is harmless.
