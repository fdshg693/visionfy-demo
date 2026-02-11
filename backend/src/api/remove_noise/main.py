import logging

import cv2
import numpy as np

from common.pipeline import create_image_processing_pipeline


logger = logging.getLogger(__name__)


def _process_remove_noise(img: np.ndarray, params) -> np.ndarray:
    logger.info("Applying median blur filter (kernel size: 3)")
    result = cv2.medianBlur(img, 3)
    logger.info("Noise removal processing completed successfully")
    return result


remove_noise = create_image_processing_pipeline(
    processor=_process_remove_noise,
)
