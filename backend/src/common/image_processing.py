"""Common image processing utilities for all API endpoints."""

from flask import Request, Response, make_response, jsonify
import cv2
import numpy as np


def validate_image_request(request: Request) -> Response | None:
    """Validate that request contains a valid image file.

    Returns None if valid, or an error Response if invalid.
    """
    if "file" not in request.files:
        return create_error_response("No file part", 400)

    file = request.files["file"]
    if file.filename == "":
        return create_error_response("No selected file", 400)

    return None


def decode_image(file, flags: int = cv2.IMREAD_COLOR) -> np.ndarray:
    """Read and decode image from uploaded file.

    Raises ValueError if image cannot be decoded.
    """
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, flags)

    if img is None:
        raise ValueError("Could not decode image")

    return img


def encode_image_response(image: np.ndarray) -> Response:
    """Encode image to JPEG and create Flask response.

    Raises RuntimeError if encoding fails.
    """
    ret, buffer = cv2.imencode(".jpg", image)

    if not ret:
        raise RuntimeError("Could not encode image")

    response = make_response(buffer.tobytes())
    response.headers["Content-Type"] = "image/jpeg"
    return response


def create_error_response(message: str, status_code: int) -> Response:
    """Create a standardized JSON error response."""
    response = jsonify({"error": message})
    response.status_code = status_code
    return response
