from dataclasses import dataclass
from typing import Optional
import logging

from flask import Request
import cv2
import numpy as np

from common.pipeline import create_image_processing_pipeline
from common.params import get_optional_float_param


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class GrayscaleParams:
    threshold: Optional[float] = None


def _parse_params(request: Request) -> GrayscaleParams:
    return GrayscaleParams(
        threshold=get_optional_float_param(request, "threshold"),
    )


def _process_grayscale(img: np.ndarray, params: GrayscaleParams) -> np.ndarray:
    logger.info("Converting image to grayscale")
    result = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    if params.threshold is not None:
        logger.info(f"Applying binary threshold: {params.threshold}")
        _, result = cv2.threshold(result, params.threshold, 255, cv2.THRESH_BINARY)

    logger.info("Grayscale processing completed successfully")
    return result


transform_grayscale = create_image_processing_pipeline(
    param_parser=_parse_params,
    processor=_process_grayscale,
)
