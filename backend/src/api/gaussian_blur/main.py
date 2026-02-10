from dataclasses import dataclass

from flask import Request, Response
import cv2

from common.image_processing import (
    validate_image_request,
    decode_image,
    encode_image_response,
    create_error_response,
)
from common.params import get_float_param, get_int_param


@dataclass(frozen=True)
class GaussianBlurParams:
    ksize_x: int = 0
    ksize_y: int = 0
    sigma_x: float = 0.0
    sigma_y: float = 0.0


def _parse_params(request: Request) -> GaussianBlurParams:
    return GaussianBlurParams(
        ksize_x=get_int_param(request, "ksizeX", 0),
        ksize_y=get_int_param(request, "ksizeY", 0),
        sigma_x=get_float_param(request, "sigmaX", 0.0),
        sigma_y=get_float_param(request, "sigmaY", 0.0),
    )


def apply_gaussian_blur(request: Request) -> Response:
    error = validate_image_request(request)
    if error is not None:
        return error

    try:
        params = _parse_params(request)
    except ValueError as exc:
        return create_error_response(str(exc), 400)

    try:
        img = decode_image(request.files["file"])

        if params.ksize_x > 0 or params.ksize_y > 0 or params.sigma_x > 0:
            ksize_x = params.ksize_x + (1 if params.ksize_x > 0 and params.ksize_x % 2 == 0 else 0)
            ksize_y = params.ksize_y + (1 if params.ksize_y > 0 and params.ksize_y % 2 == 0 else 0)
            img = cv2.GaussianBlur(img, (ksize_x, ksize_y), params.sigma_x, sigmaY=params.sigma_y)

        return encode_image_response(img)
    except ValueError as exc:
        return create_error_response(str(exc), 400)
    except Exception as e:
        return create_error_response(f"Internal Server Error: {str(e)}", 500)
