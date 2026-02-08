import cv2
import numpy as np
import torch
from anomalib.models import Patchcore
from typing import Dict, Any, Optional


def remove_noise(image: np.ndarray) -> np.ndarray:
    """
    Removes spike noise from the image using Median filter.

    Args:
        image (np.ndarray): Input image (H, W, 3).

    Returns:
        np.ndarray: Denoised image.
    """
    rgb = image.copy()
    # Spike noise removal using Median filter
    rgb = cv2.medianBlur(rgb, 3)
    return rgb


def restore_contrast(image: np.ndarray, gamma: float = 1.7) -> np.ndarray:
    """
    Restores contrast using gamma correction.

    Args:
        image (np.ndarray): Input image (H, W, 3).
        gamma (float): Gamma value used for restoration.

    Returns:
        np.ndarray: Contrast-restored image.
    """
    rgb = image.copy()
    safe_gamma = gamma if gamma > 0 else 1.0
    inv_gamma = 1.0 / safe_gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype(
        "uint8"
    )
    rgb = cv2.LUT(rgb, table)
    return rgb


def restore_brightness(image: np.ndarray, value: int = -30) -> np.ndarray:
    """
    Restores brightness by subtracting the degradation value.

    Args:
        image (np.ndarray): Input image (H, W, 3).
        value (int): Value to subtract (e.g., if degradation was +30, this should be 30. If degradation was -30, this should be -30?).
                     Wait, previous logic was: `beta = brightness_restoration_val`. `rgb - beta`.
                     If degradation added brightness, we want to subtract it.
                     Config says `restore_brightness_val: int = -30`.
                     And `brightness_range: Tuple[int, int] = (-30, -30)`.
                     So degradation is subtracting 30.
                     Restoration logic: `rgb_f - beta`. If beta is -30, then `rgb - (-30) = rgb + 30`. Correct.

    Returns:
        np.ndarray: Brightness-restored image.
    """
    rgb = image.copy()
    beta = value
    if beta != 0:
        rgb_f = rgb.astype(np.float32)
        rgb_f = rgb_f - beta
        rgb = np.clip(rgb_f, 0, 255).astype(np.uint8)
    return rgb
