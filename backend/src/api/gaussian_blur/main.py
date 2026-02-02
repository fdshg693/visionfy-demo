from dataclasses import dataclass
from typing import Tuple, Union

from flask import Request, Response, make_response
import cv2
import numpy as np


@dataclass(frozen=True)
class GaussianBlurParams:
    ksize: int = 0
    sigma: float = 0.0


def _parse_params(request: Request) -> GaussianBlurParams:
    ksize = 0
    sigma = 0.0
    try:
        if request.form.get("ksize"):
            ksize = int(request.form.get("ksize"))
        if request.form.get("sigma"):
            sigma = float(request.form.get("sigma"))
    except ValueError as exc:
        raise ValueError(
            "Invalid parameters: ksize uses int, sigma uses float"
        ) from exc
    return GaussianBlurParams(ksize=ksize, sigma=sigma)


def apply_gaussian_blur(request: Request) -> Union[Response, Tuple[str, int]]:
    """
    画像を受け取り、ガウシアンブラーを適用して返す
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

        # Apply Gaussian Blur
        if params.ksize > 0 or params.sigma > 0:
            # If ksize is provided and positive, ensure it is odd
            ksize = params.ksize
            if ksize > 0 and ksize % 2 == 0:
                ksize += 1

            img = cv2.GaussianBlur(img, (ksize, ksize), params.sigma)

        # Encode back to format (JPG)
        ret, buffer = cv2.imencode(".jpg", img)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"
        return response

    except Exception as e:
        return f"Internal Server Error: {str(e)}", 500
