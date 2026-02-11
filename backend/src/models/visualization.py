"""Visualization utilities for anomaly detection heatmaps."""

import logging

import cv2
import numpy as np

logger = logging.getLogger(__name__)


def create_heatmap_overlay(
    original_image: np.ndarray,
    anomaly_map: np.ndarray,
    overlay_alpha: float = 0.6,
    heatmap_alpha: float = 0.4,
) -> np.ndarray:
    """Create colored heatmap overlay on original image.

    Args:
        original_image: Original image in BGR format (H, W, 3)
        anomaly_map: Anomaly map from model (256, 256)
        overlay_alpha: Weight for original image
        heatmap_alpha: Weight for heatmap

    Returns:
        Overlay image in BGR format
    """
    # Normalize anomaly map to 0-255
    anom_min = anomaly_map.min()
    anom_max = anomaly_map.max()

    if anom_max - anom_min > 0:
        heatmap_normalized = (
            (anomaly_map - anom_min) / (anom_max - anom_min) * 255
        ).astype(np.uint8)
    else:
        # If anomaly map is uniform, create zero map
        heatmap_normalized = np.zeros_like(anomaly_map, dtype=np.uint8)

    # Apply colormap (JET)
    heatmap_colored = cv2.applyColorMap(heatmap_normalized, cv2.COLORMAP_JET)

    # Resize heatmap to original image size
    heatmap_resized = cv2.resize(
        heatmap_colored, (original_image.shape[1], original_image.shape[0])
    )

    # Blend images
    overlay = cv2.addWeighted(
        original_image, overlay_alpha, heatmap_resized, heatmap_alpha, 0
    )

    return overlay
