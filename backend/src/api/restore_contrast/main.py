from dataclasses import dataclass
import logging

from flask import Request
import cv2
import numpy as np

from common.pipeline import create_image_processing_pipeline
from common.params import get_float_param


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RestoreContrastParams:
    gamma: float = 1.7


def _parse_params(request: Request) -> RestoreContrastParams:
    return RestoreContrastParams(
        gamma=get_float_param(request, "gamma", 1.7),
    )


def _process_restore_contrast(
    img: np.ndarray, params: RestoreContrastParams
) -> np.ndarray:
    safe_gamma = params.gamma if params.gamma > 0 else 1.0
    logger.info(f"Applying gamma correction with gamma={safe_gamma}")
    inv_gamma = 1.0 / safe_gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype(
        "uint8"
    )
    result = cv2.LUT(img, table)
    logger.info("Contrast restoration completed successfully")
    return result


restore_contrast = create_image_processing_pipeline(
    param_parser=_parse_params,
    processor=_process_restore_contrast,
)
