"""Common image processing utilities for all API endpoints."""

from flask import Request, Response
import cv2
import numpy as np

from common.response import create_error_response
from common.validation import validate_image_file


def validate_image_request(request: Request) -> Response | None:
    """Validate that request contains a valid image file.

    Returns None if valid, or an error Response if invalid.
    """
    if "file" not in request.files:
        return create_error_response("No file part", 400, "MISSING_FILE")

    file = request.files["file"]

    # 強化されたバリデーションを使用
    return validate_image_file(file)


def decode_image(file, flags: int = cv2.IMREAD_COLOR) -> np.ndarray:
    """Read and decode image from uploaded file.

    Raises ValueError if image cannot be decoded.
    """
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, flags)

    if img is None:
        raise ValueError("Could not decode image")

    return img
