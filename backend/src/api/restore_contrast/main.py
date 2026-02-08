from dataclasses import dataclass
from typing import Tuple, Union

from flask import Request, Response, make_response
import cv2
import numpy as np


@dataclass(frozen=True)
class RestoreContrastParams:
    gamma: float = 1.7


def _parse_params(request: Request) -> RestoreContrastParams:
    try:
        gamma = float(request.form.get("gamma", 1.7))
    except ValueError as exc:
        raise ValueError("Invalid parameters: gamma must be float") from exc
    return RestoreContrastParams(gamma=gamma)


def restore_contrast(request: Request) -> Union[Response, Tuple[str, int]]:
    """
    画像を受け取り、ガンマ補正でコントラストを調整して返す
    """
    if request.method != "POST":
        return "Method not allowed", 405

    if "file" not in request.files:
        return "No file part", 400

    file = request.files["file"]
    if file.filename == "":
        return "No selected file", 400

    try:
        try:
            params = _parse_params(request)
        except ValueError as exc:
            return (str(exc), 400)

        # Read image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return "Could not decode image", 400

        # Apply gamma correction for contrast restoration
        safe_gamma = params.gamma if params.gamma > 0 else 1.0
        inv_gamma = 1.0 / safe_gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype(
            "uint8"
        )
        img = cv2.LUT(img, table)

        # Encode back to format (JPG)
        ret, buffer = cv2.imencode(".jpg", img)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"
        return response

    except Exception as e:
        return f"Internal Server Error: {str(e)}", 500
