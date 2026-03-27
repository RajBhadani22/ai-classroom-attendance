import csv
import io
import logging
import os

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", str(10 * 1024 * 1024)))  # 10 MB


def validate_image_file(content_type: str, size: int) -> tuple[bool, str]:
    """Return (ok, error_message)."""
    if content_type not in ALLOWED_IMAGE_TYPES:
        return False, f"Unsupported file type '{content_type}'. Allowed: {ALLOWED_IMAGE_TYPES}"
    if size > MAX_FILE_SIZE:
        return False, f"File too large ({size} bytes). Max: {MAX_FILE_SIZE} bytes"
    return True, ""


def build_csv_response(rows: list[dict], fieldnames: list[str]) -> str:
    """Render *rows* as a CSV string with the given *fieldnames* header."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()
