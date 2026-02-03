from dataclasses import dataclass
from typing import Tuple, Union

from flask import Request, Response, make_response
import cv2
import numpy as np


@dataclass(frozen=True)
class GaussianBlurParams:
    ksize_x: int = 0
    ksize_y: int = 0
    sigma_x: float = 0.0
    sigma_y: float = 0.0


def _parse_params(request: Request) -> GaussianBlurParams:
    try:
        ksize_x = int(request.form.get("ksizeX", 0))
        ksize_y = int(request.form.get("ksizeY", 0))
        sigma_x = float(request.form.get("sigmaX", 0.0))
        sigma_y = float(request.form.get("sigmaY", 0.0))
    except ValueError as exc:
        raise ValueError(
            "Invalid parameters: ksize must be int, sigma must be float"
        ) from exc
    return GaussianBlurParams(ksize_x=ksize_x, ksize_y=ksize_y, sigma_x=sigma_x, sigma_y=sigma_y)


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
        if params.ksize_x > 0 or params.ksize_y > 0 or params.sigma_x > 0:
            # Ensure ksize values are odd
            ksize_x = params.ksize_x + (1 if params.ksize_x > 0 and params.ksize_x % 2 == 0 else 0)
            ksize_y = params.ksize_y + (1 if params.ksize_y > 0 and params.ksize_y % 2 == 0 else 0)

            img = cv2.GaussianBlur(img, (ksize_x, ksize_y), params.sigma_x, sigmaY=params.sigma_y)

        # Encode back to format (JPG)
        ret, buffer = cv2.imencode(".jpg", img)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"
        return response

    except Exception as e:
        return f"Internal Server Error: {str(e)}", 500
