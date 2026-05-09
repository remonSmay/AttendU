"""
Face storage path utilities for SHAMS.

Storage layout:
  src/media/faces/{student_id}.jpg   ← original uploaded photo
  src/media/faces/{student_id}.npy   ← pre-computed 128-dim face encoding
"""

from pathlib import Path
from uuid import UUID

FACES_DIR = Path(__file__).parent.parent / "media" / "faces"


def get_image_path(student_id: UUID) -> Path:
    """Return the path for a student's reference face image (.jpg)."""
    FACES_DIR.mkdir(parents=True, exist_ok=True)
    return FACES_DIR / f"{student_id}.jpg"


def get_encoding_path(student_id: UUID) -> Path:
    """Return the path for a student's pre-computed face encoding (.npy)."""
    FACES_DIR.mkdir(parents=True, exist_ok=True)
    return FACES_DIR / f"{student_id}.npy"


def has_encoding(student_id: UUID) -> bool:
    """Check if a student has a pre-computed face encoding on disk."""
    return get_encoding_path(student_id).exists()
