"""Common image processing pipeline for all API endpoints."""

from typing import Callable, Any, Optional
from flask import Request, Response
import numpy as np
import logging
import cv2

from common.image_processing import validate_image_request, decode_image
from common.response import create_error_response, encode_image_response
from common.exceptions import ProcessingError


logger = logging.getLogger(__name__)


def create_image_processing_pipeline(
    param_parser: Optional[Callable[[Request], Any]] = None,
    processor: Callable[[np.ndarray, Any], np.ndarray] = None,
    decode_flags: int = cv2.IMREAD_COLOR,
    response_customizer: Optional[Callable[[Response, Any], Response]] = None,
) -> Callable[[Request], Response]:
    """
    Create a standardized image processing pipeline.

    This function creates a handler that follows the standard pattern:
    1. Validate image file upload
    2. Parse parameters (if param_parser provided)
    3. Decode image from uploaded file
    4. Apply processing function
    5. Encode result as JPEG response
    6. Optionally customize response (e.g., add headers)

    Args:
        param_parser: Function to extract parameters from request.
                     Takes Request, returns params object (e.g., dataclass).
                     If None, no parameters are passed to processor.
        processor: Function to process the image.
                  Takes (image: np.ndarray, params: Any) -> np.ndarray.
                  If param_parser is None, params will be None.
        decode_flags: OpenCV imread flags (default: IMREAD_COLOR).
                     Use 0 or cv2.IMREAD_GRAYSCALE for grayscale decoding.
        response_customizer: Optional function to customize the response.
                            Takes (response: Response, result_data: dict) -> Response.
                            Use to add custom headers or modify response.

    Returns:
        Flask request handler function.

    Example:
        >>> def parse_params(request):
        ...     return MyParams(value=int(request.form.get('value', 10)))
        >>>
        >>> def process_image(img, params):
        ...     return cv2.GaussianBlur(img, (5, 5), params.sigma)
        >>>
        >>> handler = create_image_processing_pipeline(parse_params, process_image)
    """

    def handler(request: Request) -> Response:
        # Step 1: Validate image file upload
        error = validate_image_request(request)
        if error is not None:
            return error

        # Step 2: Parse parameters (if parser provided)
        params = None
        if param_parser is not None:
            try:
                params = param_parser(request)
            except ValueError as exc:
                return create_error_response(str(exc), 400, "INVALID_PARAMETER")

        # Step 3: Decode image
        try:
            img = decode_image(request.files["file"], flags=decode_flags)
        except ValueError as exc:
            return create_error_response(str(exc), 400, "IMAGE_DECODE_ERROR")

        # Step 4: Apply processing
        try:
            result = processor(img, params)

            # Support processors returning either:
            # 1. np.ndarray (image only)
            # 2. dict with "image" and optional "metadata"
            if isinstance(result, dict):
                result_img = result["image"]
                metadata = result.get("metadata", {})
            else:
                result_img = result
                metadata = {}
        except ProcessingError as e:
            # Custom error with specific status code and error code
            logger.error(f"Processing error: {e.message}", exc_info=True)
            return create_error_response(e.message, e.status_code, e.error_code)
        except Exception as e:
            logger.error(f"Error in image processing: {str(e)}", exc_info=True)
            return create_error_response(
                f"Internal Server Error: {str(e)}", 500, "INTERNAL_ERROR"
            )

        # Step 5: Encode response
        try:
            response = encode_image_response(result_img)
        except Exception as e:
            logger.error(f"Error encoding response: {str(e)}", exc_info=True)
            return create_error_response(
                f"Failed to encode image: {str(e)}", 500, "ENCODE_ERROR"
            )

        # Step 6: Customize response (if customizer provided)
        if response_customizer is not None:
            try:
                result_data = {
                    "image": result_img,
                    "params": params,
                    "metadata": metadata,
                }
                response = response_customizer(response, result_data)
            except Exception as e:
                logger.error(f"Error customizing response: {str(e)}", exc_info=True)
                # Non-fatal: return response without customization

        return response

    return handler
