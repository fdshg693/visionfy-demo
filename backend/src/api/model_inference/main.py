from dataclasses import dataclass
from typing import Union, Tuple, Optional
import os
import logging

from flask import Request, Response, make_response
import cv2
import numpy as np
import torch
from anomalib.models import Patchcore


logger = logging.getLogger(__name__)

# Global model instance (loaded once on first request)
_MODEL_INSTANCE: Optional[torch.nn.Module] = None
_MODEL_DEVICE: str = "cpu"


@dataclass(frozen=True)
class ModelInferenceParams:
    """Parameters for model inference"""

    overlay_alpha: float = 0.6  # Weight for original image in overlay
    heatmap_alpha: float = 0.4  # Weight for heatmap in overlay


def _parse_params(request: Request) -> ModelInferenceParams:
    """Parse optional parameters from request"""
    overlay_alpha = request.form.get("overlayAlpha", "0.6")
    heatmap_alpha = request.form.get("heatmapAlpha", "0.4")

    try:
        return ModelInferenceParams(
            overlay_alpha=float(overlay_alpha), heatmap_alpha=float(heatmap_alpha)
        )
    except ValueError as exc:
        raise ValueError("Invalid parameter values") from exc


def _download_from_gcs(bucket_name: str, blob_path: str, dest_path: str) -> None:
    """Download a file from GCS to a local path."""
    from google.cloud import storage as gcs

    logger.info(f"Downloading model from gs://{bucket_name}/{blob_path} ...")
    client = gcs.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)
    blob.download_to_filename(dest_path)
    logger.info(f"Model downloaded to {dest_path}")


def _get_model_path() -> str:
    """Get the absolute path to the model checkpoint.

    Resolution order:
    1. Local file at backend/src/models/model.ckpt (for local development)
    2. GCS download via MODEL_GCS_BUCKET / MODEL_GCS_PATH env vars → /tmp/model.ckpt
    """
    # 1. Check local file first
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    local_path = os.path.join(base_dir, "models", "model.ckpt")

    if os.path.exists(local_path):
        return local_path

    # 2. Try GCS download
    gcs_bucket = os.environ.get("MODEL_GCS_BUCKET")
    gcs_path = os.environ.get("MODEL_GCS_PATH")

    if not gcs_bucket or not gcs_path:
        raise FileNotFoundError(
            f"Model checkpoint not found at {local_path} and "
            "MODEL_GCS_BUCKET / MODEL_GCS_PATH env vars are not set"
        )

    tmp_path = os.path.join("/tmp", "model.ckpt")

    if os.path.exists(tmp_path):
        logger.info(f"Using cached model at {tmp_path}")
        return tmp_path

    _download_from_gcs(gcs_bucket, gcs_path, tmp_path)
    return tmp_path


def _load_model() -> torch.nn.Module:
    """
    Load the Patchcore model from checkpoint.
    Model is loaded once and cached in global variable.
    """
    global _MODEL_INSTANCE, _MODEL_DEVICE

    if _MODEL_INSTANCE is not None:
        logger.info("Using cached model instance")
        return _MODEL_INSTANCE

    logger.info("Loading model for the first time...")

    # Determine device
    _MODEL_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {_MODEL_DEVICE}")

    # Load model
    model_path = _get_model_path()
    logger.info(f"Loading model from: {model_path}")

    model = Patchcore.load_from_checkpoint(model_path, weights_only=False)
    model.eval()
    model.to(_MODEL_DEVICE)

    _MODEL_INSTANCE = model
    logger.info("Model loaded successfully")

    return _MODEL_INSTANCE


def _image_to_tensor(image: np.ndarray) -> torch.Tensor:
    """
    Convert numpy image to PyTorch tensor for inference.
    Resizes to (256, 256) and normalizes with ImageNet statistics.

    Args:
        image: Input image in BGR format (H, W, 3)

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
    device = torch.device(_MODEL_DEVICE)
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1).to(device)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1).to(device)

    t_img = t_img.to(device)
    t_img = (t_img - mean) / std

    # Add batch dimension
    batch = t_img.unsqueeze(0)
    return batch


def _run_inference(image: np.ndarray, model: torch.nn.Module) -> dict:
    """
    Run inference on a single image.

    Args:
        image: Input image in BGR format (H, W, 3)
        model: Loaded Patchcore model

    Returns:
        Dictionary with 'pred_score' (float) and 'anomaly_map' (np.ndarray)
    """
    # Convert to tensor
    batch = _image_to_tensor(image)

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


def _create_heatmap_overlay(
    original_image: np.ndarray,
    anomaly_map: np.ndarray,
    overlay_alpha: float = 0.6,
    heatmap_alpha: float = 0.4,
) -> np.ndarray:
    """
    Create colored heatmap overlay on original image.

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


def apply_model_inference(request: Request) -> Union[Response, Tuple[str, int]]:
    """
    Receive an image, run model inference, and return heatmap overlay.
    """
    if request.method != "POST":
        return "Method not allowed", 405

    if "file" not in request.files:
        return "No file part", 400

    file = request.files["file"]
    if file.filename == "":
        return "No selected file", 400

    try:
        # Parse parameters
        try:
            params = _parse_params(request)
        except ValueError as exc:
            return str(exc), 400

        # Read image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return "Could not decode image", 400

        # Load model (cached after first call)
        try:
            model = _load_model()
        except FileNotFoundError as exc:
            logger.error(f"Model not found: {exc}")
            return f"Model file not found: {str(exc)}", 500
        except Exception as exc:
            logger.error(f"Failed to load model: {exc}", exc_info=True)
            return f"Failed to load model: {str(exc)}", 500

        # Run inference
        logger.info("Running model inference...")
        result = _run_inference(img, model)
        logger.info(f"Inference complete. Anomaly score: {result['pred_score']:.4f}")

        # Create heatmap overlay
        overlay = _create_heatmap_overlay(
            img, result["anomaly_map"], params.overlay_alpha, params.heatmap_alpha
        )

        # Encode to JPEG
        ret, buffer = cv2.imencode(".jpg", overlay)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"

        # Add anomaly score to response header
        response.headers["X-Anomaly-Score"] = str(result["pred_score"])

        return response

    except Exception as e:
        logger.error(f"Error in model inference: {str(e)}", exc_info=True)
        return f"Internal Server Error: {str(e)}", 500
