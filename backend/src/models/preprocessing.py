"""Image preprocessing utilities for model inference."""

import logging

import cv2
import numpy as np
import torch

logger = logging.getLogger(__name__)


def image_to_tensor(image: np.ndarray, device: str = "cpu") -> torch.Tensor:
    # 1. Resize to 256x256
    img_resized = cv2.resize(image, (256, 256))
    
    # 2. BGR to RGB
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    
    # 3. To Tensor [C, H, W] and Scale to [0, 1]
    t_img = torch.from_numpy(img_rgb).permute(2, 0, 1).float() / 255.0
    
    t_img = t_img.to(device)
    
    # Add batch dimension
    batch = t_img.unsqueeze(0)
    return batch
