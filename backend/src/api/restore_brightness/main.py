from dataclasses import dataclass
from typing import Tuple, Union

from flask import Request, Response, make_response
import cv2
import numpy as np


@dataclass(frozen=True)
class RestoreBrightnessParams:
    value: int = -30


def _parse_params(request: Request) -> RestoreBrightnessParams:
    try:
        value = int(request.form.get("value", -30))
    except ValueError as exc:
        raise ValueError("Invalid parameters: value must be int") from exc
    return RestoreBrightnessParams(value=value)


def restore_brightness(request: Request) -> Union[Response, Tuple[str, int]]:
    """
    画像を受け取り、明るさを調整して返す
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

        # Apply brightness restoration
        beta = params.value
        if beta != 0:
            img_f = img.astype(np.float32)
            img_f = img_f - beta
            img = np.clip(img_f, 0, 255).astype(np.uint8)

        # Encode back to format (JPG)
        ret, buffer = cv2.imencode(".jpg", img)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"
        return response

    except Exception as e:
        return f"Internal Server Error: {str(e)}", 500
