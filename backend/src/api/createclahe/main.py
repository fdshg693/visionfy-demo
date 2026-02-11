from dataclasses import dataclass
import logging

from flask import Request
import cv2
import numpy as np

from common.pipeline import create_image_processing_pipeline
from common.params import get_float_param, get_int_param


logger = logging.getLogger(__name__)


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


def _process_clahe(img: np.ndarray, params: CreateClaheParams) -> np.ndarray:
    logger.info(
        f"Applying CLAHE with clipLimit={params.clip_limit}, tileGridSize=({params.tile_grid_x}, {params.tile_grid_y})"
    )
    clahe = cv2.createCLAHE(
        clipLimit=params.clip_limit,
        tileGridSize=(params.tile_grid_x, params.tile_grid_y),
    )
    result = clahe.apply(img)
    logger.info("CLAHE processing completed successfully")
    return result


apply_clahe = create_image_processing_pipeline(
    param_parser=_parse_params,
    processor=_process_clahe,
    decode_flags=0,  # Grayscale decode for CLAHE
)
