import cv2
import numpy as np
import torch
from anomalib.models import Patchcore
from typing import Dict, Any, Optional
from new_functions import (
    remove_noise,
    restore_contrast,
    restore_brightness,
)


def preprocess_image(
    image: np.ndarray,
    use_noise_removal: bool = True,
    use_contrast_restoration: bool = True,
    gamma: float = 1.7,
    use_brightness_restoration: bool = True,
    brightness_restoration_val: int = -30,
) -> np.ndarray:
    """
    Applies preprocessing steps to an image for anomaly detection.

    Args:
        image (np.ndarray): Input image in RGB format (H, W, C).
        use_noise_removal (bool): Whether to apply noise removal (Median filter).
        use_contrast_restoration (bool): Whether to apply contrast restoration (gamma correction).
        gamma (float): Gamma value used for restoration (inverse of degradation).
        use_brightness_restoration (bool): Whether to apply brightness restoration.
        brightness_restoration_val (int): Value to subtract for brightness restoration.

    Returns:
        np.ndarray: Preprocessed image in RGB format (H, W, C).
    """
    # Ensure input is numpy array
    if not isinstance(image, np.ndarray):
        raise TypeError(f"Expected numpy.ndarray, got {type(image)}")

    # Validates input is HWC
    if image.ndim != 3 or image.shape[2] != 3:
        raise ValueError("Expected image with shape (H, W, 3)")

    rgb = image.copy()

    # ---- Step 1: Noise Removal ----
    if use_noise_removal:
        rgb = remove_noise(rgb)

    # ---- Step 2: Contrast Restoration ----
    if use_contrast_restoration:
        rgb = restore_contrast(rgb, gamma=gamma)

    # ---- Step 3: Brightness Restoration ----
    if use_brightness_restoration:
        rgb = restore_brightness(rgb, value=brightness_restoration_val)

    return rgb


def load_model(ckpt_path: str, device: str = None) -> torch.nn.Module:
    """
    Loads the Patchcore model from a checkpoint.

    Args:
        ckpt_path (str): Path to the model checkpoint (.ckpt).
        device (str, optional): Device to load the model on ('cuda' or 'cpu').
                                If None, automatically detects.

    Returns:
        torch.nn.Module: Loaded Pytorch Lightning model in eval mode.
    """
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    model = Patchcore.load_from_checkpoint(ckpt_path)
    model.eval()
    model.to(device)
    return model


def image2tensor(image: np.ndarray, device: str = "cpu") -> torch.Tensor:
    """
    Converts a numpy image to a PyTorch tensor suitable for inference.
    Resizes to (256, 256), normalizes with ImageNet stats, and adds batch dimension.

    Args:
        image (np.ndarray): Input image (H, W, 3).
        device (str): Device to place the tensor on.

    Returns:
        torch.Tensor: Normalized tensor with shape (1, 3, 256, 256).
    """
    # 1. Resize to 256x256
    img_resized = cv2.resize(image, (256, 256))

    # 2. To Tensor [C, H, W] and Normalize
    # Convert to float [0, 1]
    t_img = torch.from_numpy(img_resized).permute(2, 0, 1).float() / 255.0

    # ImageNet Mean and Std
    device = torch.device(device)
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1).to(device)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1).to(device)

    t_img = t_img.to(device)
    t_img = (t_img - mean) / std

    # Add batch dimension
    batch = t_img.unsqueeze(0)
    return batch


def tensor2image(tensor: torch.Tensor) -> np.ndarray:
    """
    Converts a tensor (e.g., anomaly map) to a numpy array (H, W).

    Args:
        tensor (torch.Tensor): Input tensor.

    Returns:
        np.ndarray: Numpy array.
    """
    return tensor.squeeze().cpu().numpy()


def run_inference(
    image: np.ndarray, model: torch.nn.Module, device: str = None
) -> Dict[str, Any]:
    """
    Runs inference on a single image using the loaded model.
    Internal steps:
      1. image2tensor: converts numpy to tensor (256x256, normalized)
      2. model forward pass
      3. tensor2image: converts anomaly map tensor to numpy

    Args:
        image (np.ndarray): Input image in RGB format (H, W, C).
        model (torch.nn.Module): Loaded Patchcore model.
        device (str, optional): Device to run inference on. If None, uses model's device.

    Returns:
        Dict[str, Any]: Dictionary containing:
            - 'pred_score' (float): Anomaly score.
            - 'anomaly_map' (np.ndarray): Anomaly heatmap (H, W).
    """
    if device is None:
        device = next(model.parameters()).device
    else:
        device = torch.device(device)

    # 1. Convert Image to Tensor
    batch = image2tensor(image, device=str(device))

    # 2. Inference
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

    # 3. Convert Result Tensor to Numpy
    anom_map_np = tensor2image(anom_map)

    return {"pred_score": score.item(), "anomaly_map": anom_map_np}
