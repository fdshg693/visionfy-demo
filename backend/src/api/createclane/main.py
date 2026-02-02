from dataclasses import dataclass
from typing import Tuple, Union

from flask import Request, Response, make_response
import cv2
import numpy as np


@dataclass(frozen=True)
class CreateClaneParams:
    clip_limit: float = 2.0
    tile_grid_x: int = 8
    tile_grid_y: int = 8


def _parse_params(request: Request) -> CreateClaneParams:
    try:
        clip_limit = float(request.form.get("clipLimit", 2.0))
        tile_grid_x = int(request.form.get("tileGridSizeX", 8))
        tile_grid_y = int(request.form.get("tileGridSizeY", 8))
    except ValueError as exc:
        raise ValueError(
            "Invalid parameters: clipLimit must be float, tileGridSize must be int"
        ) from exc

    return CreateClaneParams(
        clip_limit=clip_limit,
        tile_grid_x=tile_grid_x,
        tile_grid_y=tile_grid_y,
    )


def change_image1(request: Request) -> Union[Response, Tuple[str, int]]:
    """
    画像を受け取り、CLAHE変換を適用して返す
    reference: infra/reference/simple.py
    """
    if request.method != "POST":
        return "Method not allowed", 405

    # Check if image is present
    # 一般的なフォームデータとしてのアップロードを想定
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
        # Decode as grayscale (0 flag mimics the reference: cv2.imread("original.png", 0))
        img = cv2.imdecode(file_bytes, 0)

        if img is None:
            return "Could not decode image", 400

        # create a CLAHE object (Arguments are optional).
        clahe = cv2.createCLAHE(
            clipLimit=params.clip_limit,
            tileGridSize=(params.tile_grid_x, params.tile_grid_y),
        )
        cl1 = clahe.apply(img)

        # Encode back to format (e.g., JPG)
        # The reference saved as "clahe_histogram.jpg"
        ret, buffer = cv2.imencode(".jpg", cl1)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"
        return response

    except Exception as e:
        return f"Internal Server Error: {str(e)}", 500
