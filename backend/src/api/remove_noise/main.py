from flask import Request, Response
import cv2

from common.image_processing import (
    validate_image_request,
    decode_image,
    encode_image_response,
    create_error_response,
)


def remove_noise(request: Request) -> Response:
    error = validate_image_request(request)
    if error is not None:
        return error

    try:
        img = decode_image(request.files["file"])

        img = cv2.medianBlur(img, 3)

        return encode_image_response(img)
    except ValueError as exc:
        return create_error_response(str(exc), 400)
    except Exception as e:
        return create_error_response(f"Internal Server Error: {str(e)}", 500)
