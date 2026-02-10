from dataclasses import dataclass

from flask import Request, Response
import numpy as np

from common.image_processing import (
    validate_image_request,
    decode_image,
    encode_image_response,
    create_error_response,
)
from common.params import get_int_param


@dataclass(frozen=True)
class RestoreBrightnessParams:
    value: int = -30


def _parse_params(request: Request) -> RestoreBrightnessParams:
    return RestoreBrightnessParams(
        value=get_int_param(request, "value", -30),
    )


def restore_brightness(request: Request) -> Response:
    error = validate_image_request(request)
    if error is not None:
        return error

    try:
        params = _parse_params(request)
    except ValueError as exc:
        return create_error_response(str(exc), 400)

    try:
        img = decode_image(request.files["file"])

        beta = params.value
        if beta != 0:
            img_f = img.astype(np.float32)
            img_f = img_f - beta
            img = np.clip(img_f, 0, 255).astype(np.uint8)

        return encode_image_response(img)
    except ValueError as exc:
        return create_error_response(str(exc), 400)
    except Exception as e:
        return create_error_response(f"Internal Server Error: {str(e)}", 500)
