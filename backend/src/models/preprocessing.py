"""Image preprocessing utilities for model inference."""

import logging

import cv2
import numpy as np
import torch

logger = logging.getLogger(__name__)


def image_to_tensor(image: np.ndarray, device: str = "cpu") -> torch.Tensor:
    """Convert numpy image to PyTorch tensor for inference.

    Resizes to (256, 256) and normalizes with ImageNet statistics.

    Args:
        image: Input image in BGR format (H, W, 3)
        device: Device to place tensor on ("cpu" or "cuda")

    Returns:
        Normalized tensor with shape (1, 3, 256, 256)
    """
    # Resize to 256x256
    img_resized = cv2.resize(image, (256, 256))

    # BGR to RGB
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

    # To tensor [C, H, W] and normalize to [0, 1]
    t_img = torch.from_numpy(img_rgb).permute(2, 0, 1).float() / 255.0

    # ImageNet normalization
    torch_device = torch.device(device)
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1).to(torch_device)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1).to(torch_device)

    t_img = t_img.to(torch_device)
    t_img = (t_img - mean) / std

    # Add batch dimension
    batch = t_img.unsqueeze(0)
    return batch
