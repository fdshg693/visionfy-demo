"""Inference logic for anomaly detection model."""

import logging

import numpy as np
import torch

from models.preprocessing import image_to_tensor

logger = logging.getLogger(__name__)


def run_inference(
    image: np.ndarray, model: torch.nn.Module, device: str = "cpu"
) -> dict:
    """Run inference on a single image.

    Args:
        image: Input image in BGR format (H, W, 3)
        model: Loaded Patchcore model
        device: Device to use for inference ("cpu" or "cuda")

    Returns:
        Dictionary with 'pred_score' (float) and 'anomaly_map' (np.ndarray)
    """
    # Convert to tensor
    batch = image_to_tensor(image, device)

    # Inference
    with torch.no_grad():
        output = model(batch)

    # Extract results
    if hasattr(output, "pred_score"):
        score = output.pred_score
        anom_map = output.anomaly_map
    elif isinstance(output, dict):
        score = output["pred_score"]
        anom_map = output["anomaly_map"]
    else:
        raise ValueError(f"Unexpected model output type: {type(output)}")

    # Convert to numpy
    anom_map_np = anom_map.squeeze().cpu().numpy()

    return {"pred_score": score.item(), "anomaly_map": anom_map_np}
