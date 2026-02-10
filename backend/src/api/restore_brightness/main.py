from dataclasses import dataclass
import logging

from flask import Request
import numpy as np

from common.pipeline import create_image_processing_pipeline
from common.params import get_int_param


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RestoreBrightnessParams:
    value: int = -30


def _parse_params(request: Request) -> RestoreBrightnessParams:
    return RestoreBrightnessParams(
        value=get_int_param(request, "value", -30),
    )


def _process_restore_brightness(
    img: np.ndarray, params: RestoreBrightnessParams
) -> np.ndarray:
    beta = params.value
    if beta != 0:
        logger.info(f"Adjusting brightness with beta={beta}")
        img_f = img.astype(np.float32)
        img_f = img_f - beta
        result = np.clip(img_f, 0, 255).astype(np.uint8)
        logger.info("Brightness restoration completed successfully")
        return result
    else:
        logger.info("Skipping brightness adjustment (beta=0)")
        return img


restore_brightness = create_image_processing_pipeline(
    param_parser=_parse_params,
    processor=_process_restore_brightness,
)
