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
class CreateClaheParams:
    clip_limit: float = 2.0
    tile_grid_x: int = 8
    tile_grid_y: int = 8


def _parse_params(request: Request) -> CreateClaheParams:
    return CreateClaheParams(
        clip_limit=get_float_param(request, "clipLimit", 2.0),
        tile_grid_x=get_int_param(request, "tileGridSizeX", 8),
        tile_grid_y=get_int_param(request, "tileGridSizeY", 8),
    )


def apply_clahe(request: Request) -> Response:
    error = validate_image_request(request)
    if error is not None:
        return error

    try:
        params = _parse_params(request)
    except ValueError as exc:
        return create_error_response(str(exc), 400)

    try:
        img = decode_image(request.files["file"], flags=0)

        clahe = cv2.createCLAHE(
            clipLimit=params.clip_limit,
            tileGridSize=(params.tile_grid_x, params.tile_grid_y),
        )
        cl1 = clahe.apply(img)

        return encode_image_response(cl1)
    except ValueError as exc:
        return create_error_response(str(exc), 400)
    except Exception as e:
        return create_error_response(f"Internal Server Error: {str(e)}", 500)
