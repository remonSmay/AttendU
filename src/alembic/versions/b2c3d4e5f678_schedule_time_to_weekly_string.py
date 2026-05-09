"""schedule_time to weekly string

Revision ID: b2c3d4e5f678
Revises: a0afd42f093d
Create Date: 2026-05-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'b2c3d4e5f678'
down_revision: Union[str, Sequence[str], None] = 'a0afd42f093d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert existing TIMESTAMP values to "MONDAY 09:00" format,
    # then change the column type to VARCHAR(20).
    op.execute("""
        ALTER TABLE sections
        ALTER COLUMN schedule_time TYPE VARCHAR(20)
        USING upper(trim(to_char(schedule_time AT TIME ZONE 'UTC', 'Day')))
              || ' '
              || to_char(schedule_time AT TIME ZONE 'UTC', 'HH24:MI')
    """)


def downgrade() -> None:
    # Convert "MONDAY 09:00" strings back to a fixed timestamp
    # (uses next Monday at the stored time as a best-effort recovery).
    op.execute("""
        ALTER TABLE sections
        ALTER COLUMN schedule_time TYPE TIMESTAMP WITH TIME ZONE
        USING (
            CURRENT_DATE
            + (
                CASE split_part(schedule_time, ' ', 1)
                    WHEN 'MONDAY'    THEN INTERVAL '0 days'
                    WHEN 'TUESDAY'   THEN INTERVAL '1 day'
                    WHEN 'WEDNESDAY' THEN INTERVAL '2 days'
                    WHEN 'THURSDAY'  THEN INTERVAL '3 days'
                    WHEN 'FRIDAY'    THEN INTERVAL '4 days'
                    WHEN 'SATURDAY'  THEN INTERVAL '5 days'
                    WHEN 'SUNDAY'    THEN INTERVAL '6 days'
                    ELSE INTERVAL '0 days'
                END
            )
            + split_part(schedule_time, ' ', 2)::TIME
        )::TIMESTAMPTZ
    """)
