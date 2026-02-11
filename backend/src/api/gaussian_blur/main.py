from dataclasses import dataclass
import logging

from flask import Request
import cv2
import numpy as np

from common.pipeline import create_image_processing_pipeline
from common.params import get_float_param, get_int_param


logger = logging.getLogger(__name__)


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


def _process_gaussian_blur(img: np.ndarray, params: GaussianBlurParams) -> np.ndarray:
    if params.ksize_x > 0 or params.ksize_y > 0 or params.sigma_x > 0:
        ksize_x = params.ksize_x + (
            1 if params.ksize_x > 0 and params.ksize_x % 2 == 0 else 0
        )
        ksize_y = params.ksize_y + (
            1 if params.ksize_y > 0 and params.ksize_y % 2 == 0 else 0
        )
        logger.info(
            f"Applying Gaussian blur with ksize=({ksize_x}, {ksize_y}), sigma=({params.sigma_x}, {params.sigma_y})"
        )
        result = cv2.GaussianBlur(
            img, (ksize_x, ksize_y), params.sigma_x, sigmaY=params.sigma_y
        )
        logger.info("Gaussian blur processing completed successfully")
        return result
    else:
        logger.info("Skipping Gaussian blur (all parameters are zero)")
        return img


apply_gaussian_blur = create_image_processing_pipeline(
    param_parser=_parse_params,
    processor=_process_gaussian_blur,
)
