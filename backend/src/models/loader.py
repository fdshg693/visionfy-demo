"""Model loading and caching utilities."""

import os
import logging
from typing import Optional

import torch
from anomalib.models import Patchcore

from storage.gcs_client import download_from_gcs

logger = logging.getLogger(__name__)

# Global model instance (loaded once on first request)
_MODEL_INSTANCE: Optional[torch.nn.Module] = None
_MODEL_DEVICE: str = "cpu"


def get_model_path() -> str:
    """Get the absolute path to the model checkpoint.

    Resolution order:
    1. Local file at backend/src/models/model.ckpt (for local development)
    2. GCS download via MODEL_GCS_BUCKET / MODEL_GCS_PATH env vars → /tmp/model.ckpt

    Returns:
        Path to model checkpoint file

    Raises:
        FileNotFoundError: If model is not found locally and GCS env vars are not set
    """
    # 1. Check local file first (backend/src/models/model.ckpt)
    models_dir = os.path.dirname(os.path.abspath(__file__))
    local_path = os.path.join(models_dir, "model.ckpt")

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

    download_from_gcs(gcs_bucket, gcs_path, tmp_path)
    return tmp_path


def load_model() -> torch.nn.Module:
    """Load the Patchcore model from checkpoint.

    Model is loaded once and cached in global variable.

    Returns:
        Loaded Patchcore model in eval mode

    Raises:
        FileNotFoundError: If model checkpoint is not found
        Exception: If model loading fails
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
    model_path = get_model_path()
    logger.info(f"Loading model from: {model_path}")

    model = Patchcore.load_from_checkpoint(model_path, weights_only=False)
    model.eval()
    model.to(_MODEL_DEVICE)

    _MODEL_INSTANCE = model
    logger.info("Model loaded successfully")

    return _MODEL_INSTANCE


def get_model_device() -> str:
    """Get the device where the model is loaded.

    Returns:
        Device string ("cpu" or "cuda")
    """
    return _MODEL_DEVICE
