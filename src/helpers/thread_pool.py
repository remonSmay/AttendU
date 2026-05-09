"""
Shared thread pool for CPU-bound operations (face recognition, image processing).

Why max_workers=4:
  face_recognition is CPU-bound and dlib uses internal threading.
  4 workers is sufficient for classroom-scale (30-50 students).
  More workers would cause CPU contention, not speed improvement.
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, TypeVar

_executor = ThreadPoolExecutor(max_workers=4)

T = TypeVar("T")


async def run_in_thread(fn: Callable[[], T]) -> T:
    """
    Run a CPU-bound blocking function in a thread pool
    without blocking the asyncio event loop.

    Usage:
        result = await run_in_thread(lambda: face_recognition.face_encodings(image))
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, fn)
