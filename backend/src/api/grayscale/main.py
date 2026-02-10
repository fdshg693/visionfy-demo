from dataclasses import dataclass
from typing import Optional

from flask import Request, Response
import cv2

from common.image_processing import (
    validate_image_request,
    decode_image,
    encode_image_response,
    create_error_response,
)
from common.params import get_optional_float_param


@dataclass(frozen=True)
class GrayscaleParams:
    threshold: Optional[float] = None


def _parse_params(request: Request) -> GrayscaleParams:
    return GrayscaleParams(
        threshold=get_optional_float_param(request, "threshold"),
    )


def transform_grayscale(request: Request) -> Response:
    error = validate_image_request(request)
    if error is not None:
        return error

    try:
        params = _parse_params(request)
    except ValueError as exc:
        return create_error_response(str(exc), 400)

    try:
        img = decode_image(request.files["file"])

        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        if params.threshold is not None:
            _, img = cv2.threshold(img, params.threshold, 255, cv2.THRESH_BINARY)

        return encode_image_response(img)
    except ValueError as exc:
        return create_error_response(str(exc), 400)
    except Exception as e:
        return create_error_response(f"Internal Server Error: {str(e)}", 500)
