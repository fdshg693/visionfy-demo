"""Route decorators for standardized logging and error handling."""

import functools
import logging

from flask import request

logger = logging.getLogger(__name__)


def image_endpoint(name: str):
    """Decorator for image processing endpoints.

    Provides:
    - Request logging (form params + file keys)
    - Success logging
    - Error logging with traceback
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            logger.info(
                f"[{name}] Request received - form: {dict(request.form)}, "
                f"files: {list(request.files.keys())}"
            )
            try:
                result = func(*args, **kwargs)
                logger.info(f"[{name}] Processing completed successfully")
                return result
            except Exception as e:
                logger.error(f"[{name}] Error: {str(e)}", exc_info=True)
                raise

        return wrapper

    return decorator
