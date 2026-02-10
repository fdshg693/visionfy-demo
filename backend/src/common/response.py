"""Standardized response utilities for all API endpoints."""

from typing import Optional

from flask import Response, make_response, jsonify
import cv2
import numpy as np


def create_error_response(
    message: str, status_code: int, error_code: Optional[str] = None
) -> Response:
    """Create a standardized JSON error response.

    Args:
        message: Human-readable error message
        status_code: HTTP status code (e.g., 400, 500)
        error_code: Optional machine-readable error code (e.g., "INVALID_PARAMETER")

    Returns:
        Flask Response object with JSON error payload
    """
    payload = {"error": message}
    if error_code is not None:
        payload["code"] = error_code

    response = jsonify(payload)
    response.status_code = status_code
    return response


def create_success_response(data: bytes, mimetype: str = "image/jpeg") -> Response:
    """Create a standardized success response.

    Args:
        data: Binary data to send (typically encoded image)
        mimetype: MIME type for Content-Type header

    Returns:
        Flask Response object with binary payload
    """
    response = make_response(data)
    response.headers["Content-Type"] = mimetype
    return response


def encode_image_response(image: np.ndarray) -> Response:
    """Encode image to JPEG and create Flask response.

    This is a convenience wrapper around create_success_response
    for the common case of returning OpenCV images.

    Args:
        image: NumPy array representing the image

    Returns:
        Flask Response object with JPEG image

    Raises:
        RuntimeError: If image encoding fails
    """
    ret, buffer = cv2.imencode(".jpg", image)

    if not ret:
        raise RuntimeError("Could not encode image")

    return create_success_response(buffer.tobytes(), mimetype="image/jpeg")
