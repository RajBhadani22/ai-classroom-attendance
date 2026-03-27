"""
Face recognition service.

When the ``face_recognition`` library is available (requires dlib / cmake) it
is used for real encoding and matching.  When it is *not* available a mock
implementation is activated so that the rest of the application can run in
testing / development environments without native dependencies.
"""

import io
import json
import logging
import os
import random

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

TOLERANCE = float(os.getenv("FACE_RECOGNITION_TOLERANCE", "0.5"))

# ---------------------------------------------------------------------------
# Try to import the real face_recognition library
# ---------------------------------------------------------------------------
try:
    import face_recognition as _fr  # noqa: F401
    _FACE_RECOGNITION_AVAILABLE = True
    logger.info("face_recognition library loaded – using real face recognition")
except ImportError:
    _FACE_RECOGNITION_AVAILABLE = False
    logger.warning(
        "face_recognition library not available – using mock implementation"
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def encode_face(image_bytes: bytes) -> list:
    """
    Return a list of face encodings (each encoding is a plain Python list of
    128 floats) found in *image_bytes*.

    Returns an empty list when no face is detected.
    """
    if _FACE_RECOGNITION_AVAILABLE:
        return _real_encode_face(image_bytes)
    return _mock_encode_face(image_bytes)


def process_classroom_image(image_bytes: bytes, students: list) -> list:
    """
    Detect all faces in *image_bytes* and try to match each one against the
    known *students*.

    Parameters
    ----------
    image_bytes : bytes
        Raw bytes of the classroom photo.
    students : list
        ORM Student objects that have a ``get_face_encodings()`` method.

    Returns
    -------
    list of dict with keys:
        face_location  – (top, right, bottom, left)
        student_id     – int or None
        student_name   – str or None
        roll_number    – str or None
        confidence     – float or None  (1 – normalised distance)
        status         – "present" | "unknown"
    """
    if _FACE_RECOGNITION_AVAILABLE:
        return _real_process_classroom_image(image_bytes, students)
    return _mock_process_classroom_image(image_bytes, students)


def validate_image(image_bytes: bytes) -> bool:
    """Return True if at least one face is detected in *image_bytes*."""
    if _FACE_RECOGNITION_AVAILABLE:
        return _real_validate_image(image_bytes)
    return _mock_validate_image(image_bytes)


# ---------------------------------------------------------------------------
# Real implementation
# ---------------------------------------------------------------------------

def _load_rgb_array(image_bytes: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return np.array(image)


def _real_encode_face(image_bytes: bytes) -> list:
    import face_recognition as fr
    try:
        rgb = _load_rgb_array(image_bytes)
        encodings = fr.face_encodings(rgb)
        return [enc.tolist() for enc in encodings]
    except Exception as exc:
        logger.error("Error encoding face: %s", exc)
        return []


def _real_validate_image(image_bytes: bytes) -> bool:
    import face_recognition as fr
    try:
        rgb = _load_rgb_array(image_bytes)
        locations = fr.face_locations(rgb)
        return len(locations) > 0
    except Exception as exc:
        logger.error("Error validating image: %s", exc)
        return False


def _real_process_classroom_image(image_bytes: bytes, students: list) -> list:
    import face_recognition as fr

    results = []
    try:
        rgb = _load_rgb_array(image_bytes)
        face_locations = fr.face_locations(rgb)
        face_encodings = fr.face_encodings(rgb, face_locations)
    except Exception as exc:
        logger.error("Error processing classroom image: %s", exc)
        return results

    # Build known encoding arrays
    known = []  # list of (student, np.ndarray)
    for student in students:
        for enc in student.get_face_encodings():
            known.append((student, np.array(enc)))

    for location, encoding in zip(face_locations, face_encodings):
        match_result = {
            "face_location": list(location),
            "student_id": None,
            "student_name": None,
            "roll_number": None,
            "confidence": None,
            "status": "unknown",
        }

        if known:
            known_encodings = [k[1] for k in known]
            distances = fr.face_distance(known_encodings, encoding)
            best_idx = int(np.argmin(distances))
            best_dist = float(distances[best_idx])

            if best_dist <= TOLERANCE:
                student = known[best_idx][0]
                match_result.update(
                    {
                        "student_id": student.id,
                        "student_name": student.name,
                        "roll_number": student.roll_number,
                        "confidence": round(1.0 - best_dist, 4),
                        "status": "present",
                    }
                )

        results.append(match_result)

    return results


# ---------------------------------------------------------------------------
# Mock implementation (no native deps required)
# ---------------------------------------------------------------------------

def _mock_encode_face(image_bytes: bytes) -> list:
    """Return a single random 128-D encoding to simulate a detected face."""
    try:
        Image.open(io.BytesIO(image_bytes))  # validate it is an image
    except Exception:
        return []
    encoding = np.random.rand(128).tolist()
    return [encoding]


def _mock_validate_image(image_bytes: bytes) -> bool:
    try:
        Image.open(io.BytesIO(image_bytes))
        return True
    except Exception:
        return False


def _mock_process_classroom_image(image_bytes: bytes, students: list) -> list:
    """
    Simulate finding faces equal to min(3, len(students)) and randomly
    assigning them to students.
    """
    try:
        Image.open(io.BytesIO(image_bytes))
    except Exception:
        logger.error("Mock: could not open image")
        return []

    active_students = [s for s in students if getattr(s, "is_active", True)]
    num_faces = min(3, len(active_students)) if active_students else 1
    sampled = random.sample(active_students, num_faces) if active_students else []

    results = []
    for i, student in enumerate(sampled):
        top = 50 + i * 120
        results.append(
            {
                "face_location": [top, top + 100, top + 100, top],
                "student_id": student.id,
                "student_name": student.name,
                "roll_number": student.roll_number,
                "confidence": round(random.uniform(0.65, 0.99), 4),
                "status": "present",
            }
        )

    # Add one unknown face for realism when there are students
    if active_students:
        i = num_faces
        top = 50 + i * 120
        results.append(
            {
                "face_location": [top, top + 100, top + 100, top],
                "student_id": None,
                "student_name": None,
                "roll_number": None,
                "confidence": None,
                "status": "unknown",
            }
        )

    return results
