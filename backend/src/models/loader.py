"""Model loading and caching utilities."""

import os
import logging
from typing import Optional

import torch
from anomalib.models import Patchcore

from storage.gcs_client import download_model_from_gcs

logger = logging.getLogger(__name__)

# Global model instance (loaded once on first request)
_MODEL_INSTANCE: Optional[torch.nn.Module] = None
_MODEL_DEVICE: str = "cpu"


_MODEL_FILENAME = "model.ckpt"


def _resolve_cache_dir() -> str:
    """Decide the single writable directory used to hold the model checkpoint.

    Precedence:
    1. ``MODEL_CACHE_DIR`` — explicit override.
    2. ``/tmp`` when ``K_SERVICE`` is set — Cloud Run's only writable location.
    3. This module's directory — convenient for local development where the
       checkpoint may be placed manually alongside the source.
    """
    explicit = os.environ.get("MODEL_CACHE_DIR")
    if explicit:
        return explicit
    if os.environ.get("K_SERVICE"):
        return "/tmp"
    return os.path.dirname(os.path.abspath(__file__))


def get_model_path() -> str:
    """Return the path to the model checkpoint, fetching from GCS if absent.

    The checkpoint lives at a single resolved cache path (see
    :func:`_resolve_cache_dir`). If the file is missing, it is downloaded
    in place via :func:`download_model_from_gcs`.
    """
    path = os.path.join(_resolve_cache_dir(), _MODEL_FILENAME)

    if os.path.exists(path):
        logger.info(f"Using cached model at {path}")
        return path

    download_model_from_gcs(path)
    return path


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
