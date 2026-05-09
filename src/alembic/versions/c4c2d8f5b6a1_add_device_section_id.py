"""add device section id

Revision ID: c4c2d8f5b6a1
Revises: b2c3d4e5f678
Create Date: 2026-05-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4c2d8f5b6a1"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f678"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("devices", sa.Column("section_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_devices_section_id",
        "devices",
        "sections",
        ["section_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_devices_section_id", "devices", type_="foreignkey")
    op.drop_column("devices", "section_id")
