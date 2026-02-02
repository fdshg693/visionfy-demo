from dataclasses import dataclass
from typing import Optional, Tuple, Union

from flask import Request, Response, make_response
import cv2
import numpy as np


@dataclass(frozen=True)
class GrayscaleParams:
    threshold: Optional[float] = None


def _parse_params(request: Request) -> GrayscaleParams:
    threshold = request.form.get("threshold")
    if threshold is None or threshold == "":
        return GrayscaleParams(threshold=None)
    try:
        return GrayscaleParams(threshold=float(threshold))
    except ValueError as exc:
        raise ValueError("Invalid threshold value") from exc


def transform_grayscale(request: Request) -> Union[Response, Tuple[str, int]]:
    """
    画像を受け取り、グレースケール変換を適用して返す
    """
    if request.method != "POST":
        return "Method not allowed", 405

    if "file" not in request.files:
        return "No file part", 400

    file = request.files["file"]
    if file.filename == "":
        return "No selected file", 400

    try:
        # Parse optional parameters
        try:
            params = _parse_params(request)
        except ValueError as exc:
            return (str(exc), 400)

        # Read image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return "Could not decode image", 400

        # Apply Grayscale
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply Threshold if provided
        if params.threshold is not None:
            _, img = cv2.threshold(
                img, params.threshold, 255, cv2.THRESH_BINARY
            )

        # Encode back to format (JPG)
        ret, buffer = cv2.imencode(".jpg", img)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"
        return response

    except Exception as e:
        return f"Internal Server Error: {str(e)}", 500
