from dataclasses import dataclass

from flask import Request, Response
import cv2
import numpy as np

from common.image_processing import (
    validate_image_request,
    decode_image,
    encode_image_response,
    create_error_response,
)
from common.params import get_float_param


@dataclass(frozen=True)
class RestoreContrastParams:
    gamma: float = 1.7


def _parse_params(request: Request) -> RestoreContrastParams:
    return RestoreContrastParams(
        gamma=get_float_param(request, "gamma", 1.7),
    )


def restore_contrast(request: Request) -> Response:
    error = validate_image_request(request)
    if error is not None:
        return error

    try:
        params = _parse_params(request)
    except ValueError as exc:
        return create_error_response(str(exc), 400)

    try:
        img = decode_image(request.files["file"])

        safe_gamma = params.gamma if params.gamma > 0 else 1.0
        inv_gamma = 1.0 / safe_gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype(
            "uint8"
        )
        img = cv2.LUT(img, table)

        return encode_image_response(img)
    except ValueError as exc:
        return create_error_response(str(exc), 400)
    except Exception as e:
        return create_error_response(f"Internal Server Error: {str(e)}", 500)
