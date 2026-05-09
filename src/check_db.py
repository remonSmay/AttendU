from sqlalchemy import create_engine, text
from helpers.config import get_settings

settings = get_settings()
engine = create_engine(settings.DATABASE_URL.replace('postgresql+asyncpg', 'postgresql'))

with engine.connect() as conn:
    res = conn.execute(text("SELECT conname, contype FROM pg_constraint WHERE conname = 'uq_enrollment_student_section'")).fetchall()
    print(f"Constraints: {res}")
    
    res2 = conn.execute(text("SELECT relname FROM pg_class WHERE relname = 'uq_enrollment_student_section'")).fetchall()
    print(f"Relations: {res2}")
