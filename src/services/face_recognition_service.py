"""
Face Recognition Service for SHAMS.

Uses face_recognition 1.3.0 (dlib backend).
All CPU-bound operations run via run_in_thread() to avoid blocking the event loop.

Encoding format: 128-dimensional float64 numpy array.
Similarity: 1.0 - face_distance (higher = more similar, threshold = 0.50 tolerance).
"""

from __future__ import annotations

import io
import logging
from pathlib import Path
from uuid import UUID

import face_recognition
import numpy as np

from helpers.face_paths import (
    get_encoding_path,
    get_image_path,
    has_encoding,
)
from helpers.thread_pool import run_in_thread

logger = logging.getLogger(__name__)

# ── Similarity threshold ──────────────────────────────────────
# face_recognition uses "distance" (lower = more similar).
# We expose "similarity" = 1.0 - distance (higher = more similar).
# Threshold 0.50 distance = 0.50 similarity minimum to accept.
FACE_DISTANCE_TOLERANCE = 0.50
FACE_SIMILARITY_THRESHOLD = 1.0 - FACE_DISTANCE_TOLERANCE  # = 0.50

# ── In-memory encoding cache ──────────────────────────────────
# Keyed by student UUID. Populated on first load or face registration.
# Cleared when a student's face is re-registered.
_encoding_cache: dict[UUID, np.ndarray] = {}


# ─────────────────────────────────────────────────────────────
# REGISTRATION
# ─────────────────────────────────────────────────────────────

async def register_face(student_id: UUID, image_bytes: bytes) -> str:
    """
    Register a student's face from uploaded image bytes.

    Steps:
      1. Decode image bytes to numpy RGB array
      2. Detect face encodings (must find exactly one face)
      3. Save original image as .jpg
      4. Save encoding as .npy
      5. Update in-memory cache
      6. Return file path string to store in student.face_reference_image

    Raises:
      ValueError: if no face detected or more than one face detected
    """
    def _compute() -> tuple[np.ndarray, list]:
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        encodings = face_recognition.face_encodings(image)
        return image, encodings

    image_array, encodings = await run_in_thread(_compute)

    if len(encodings) == 0:
        raise ValueError(
            "No face detected in the uploaded image. "
            "Please use a clear frontal face photo with good lighting."
        )
    if len(encodings) > 1:
        raise ValueError(
            f"Multiple faces detected ({len(encodings)}) in the image. "
            "Please upload a photo with only one person."
        )

    encoding = encodings[0]
    img_path = get_image_path(student_id)
    enc_path = get_encoding_path(student_id)

    # Save original image
    img_path.write_bytes(image_bytes)

    # Save pre-computed encoding
    np.save(str(enc_path), encoding)

    # Update cache
    _encoding_cache[student_id] = encoding

    logger.info(f"Face registered for student {student_id}")
    return str(img_path)


# ─────────────────────────────────────────────────────────────
# VERIFICATION — 1-vs-1 (RFID + Face flow)
# ─────────────────────────────────────────────────────────────

async def verify_face_for_student(
    student_id: UUID,
    image_bytes: bytes,
) -> tuple[bool, float]:
    """
    Compare a captured image against ONE specific student's registered face.
    Used in RFID + Face flow: student already identified by RFID tap.

    Returns:
      (matched: bool, similarity_score: float)
      similarity_score is in range [0.0, 1.0] — higher is more similar.

    Raises:
      ValueError: if student has no registered face encoding
      ValueError: if no face detected in the captured image
    """
    if not has_encoding(student_id):
        raise ValueError(
            f"Student {student_id} has no registered face. "
            "Register a face photo first via POST /api/v1/students/{id}/face"
        )

    known_encoding = _load_encoding(student_id)

    def _compare() -> tuple[bool, float]:
        image = face_recognition.load_image_file(io.BytesIO(image_bytes))
        unknown_encodings = face_recognition.face_encodings(image)

        if len(unknown_encodings) == 0:
            raise ValueError("No face detected in the captured image.")

        unknown_encoding = unknown_encodings[0]
        distance = face_recognition.face_distance([known_encoding], unknown_encoding)[0]
        similarity = float(1.0 - distance)
        matched = similarity >= FACE_SIMILARITY_THRESHOLD
        return matched, similarity

    matched, similarity = await run_in_thread(_compare)
    logger.info(
        f"Face verify for student {student_id}: "
        f"matched={matched}, similarity={similarity:.3f}"
    )
    return matched, similarity


# ─────────────────────────────────────────────────────────────
# REAL-TIME WEBCAM — Frame Capture & Verify
# ─────────────────────────────────────────────────────────────

async def capture_and_verify(
    student_id: UUID,
    camera_index: int = 0,
) -> tuple[bool, float, bytes | None]:
    """
    Capture a single frame from the backend machine's webcam (cv2.VideoCapture),
    then verify against a specific student's encoding.

    Used when the backend server has a webcam directly attached.

    Returns:
      (matched: bool, similarity_score: float, frame_jpeg_bytes: bytes | None)
      frame_jpeg_bytes can be used for audit logging.

    Raises:
      RuntimeError: if webcam cannot be opened
      ValueError: if student has no registered face or no face in frame
    """
    import cv2

    if not has_encoding(student_id):
        raise ValueError(f"Student {student_id} has no registered face encoding.")

    def _capture_frame() -> bytes:
        cap = cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            raise RuntimeError(
                f"Cannot open webcam at index {camera_index}. "
                "Ensure the webcam is connected to the backend server."
            )
        try:
            ret, frame = cap.read()
            if not ret or frame is None:
                raise RuntimeError("Failed to capture frame from webcam.")
            _, buffer = cv2.imencode(".jpg", frame)
            return bytes(buffer)
        finally:
            cap.release()

    frame_bytes = await run_in_thread(_capture_frame)
    matched, similarity = await verify_face_for_student(student_id, frame_bytes)
    return matched, similarity, frame_bytes


# ─────────────────────────────────────────────────────────────
# CACHE HELPERS
# ─────────────────────────────────────────────────────────────

def _load_encoding(student_id: UUID) -> np.ndarray:
    """Load encoding from cache or disk. Cache miss triggers disk read."""
    if student_id in _encoding_cache:
        return _encoding_cache[student_id]

    enc_path = get_encoding_path(student_id)
    if not enc_path.exists():
        raise ValueError(f"No encoding file found for student {student_id}")

    encoding = np.load(str(enc_path))
    _encoding_cache[student_id] = encoding
    return encoding


def invalidate_cache(student_id: UUID) -> None:
    """Call this when a student's face is re-registered."""
    _encoding_cache.pop(student_id, None)


def preload_encodings_for_section(student_ids: list[UUID]) -> int:
    """
    Pre-load encodings for all students in a section into memory cache.
    Call this when a session starts to warm the cache.
    Returns count of successfully loaded encodings.
    """
    loaded = 0
    for sid in student_ids:
        try:
            _load_encoding(sid)
            loaded += 1
        except ValueError:
            pass  # Student has no face registered — skip silently
    logger.info(f"Pre-loaded {loaded}/{len(student_ids)} face encodings for section")
    return loaded
