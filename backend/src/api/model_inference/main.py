from dataclasses import dataclass
import logging

from flask import Request, Response
import numpy as np

from common.pipeline import create_image_processing_pipeline
from common.params import get_float_param
from common.exceptions import ProcessingError
from models.loader import load_model
from models.inference import run_inference
from models.visualization import create_heatmap_overlay


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ModelInferenceParams:
    """Parameters for model inference"""

    overlay_alpha: float = 0.6
    heatmap_alpha: float = 0.4


def _parse_params(request: Request) -> ModelInferenceParams:
    return ModelInferenceParams(
        overlay_alpha=get_float_param(request, "overlayAlpha", 0.6),
        heatmap_alpha=get_float_param(request, "heatmapAlpha", 0.4),
    )


def _process_model_inference(img: np.ndarray, params: ModelInferenceParams) -> dict:
    """
    Process image through model inference pipeline.

    Returns dict with "image" (overlay) and "metadata" (anomaly_score).
    """
    # Load model (cached after first call)
    try:
        model = load_model()
        device = "cpu"  # Use CPU for lightweight execution
    except FileNotFoundError as exc:
        logger.error(f"Model not found: {exc}")
        raise ProcessingError(
            f"Model file not found: {str(exc)}", 500, "MODEL_NOT_FOUND"
        )
    except Exception as exc:
        logger.error(f"Failed to load model: {exc}", exc_info=True)
        raise ProcessingError(
            f"Failed to load model: {str(exc)}", 500, "MODEL_LOAD_ERROR"
        )

    # Run inference
    logger.info("Running model inference...")
    result = run_inference(img, model, device)
    logger.info(f"Inference complete. Anomaly score: {result['pred_score']:.4f}")

    # Create heatmap overlay
    overlay = create_heatmap_overlay(
        img, result["anomaly_map"], params.overlay_alpha, params.heatmap_alpha
    )

    # Return image with metadata
    return {
        "image": overlay,
        "metadata": {"anomaly_score": result["pred_score"]},
    }


def _customize_response(response: Response, result_data: dict) -> Response:
    """Add anomaly score to response header."""
    metadata = result_data.get("metadata", {})
    if "anomaly_score" in metadata:
        response.headers["X-Anomaly-Score"] = str(metadata["anomaly_score"])
    return response


apply_model_inference = create_image_processing_pipeline(
    param_parser=_parse_params,
    processor=_process_model_inference,
    response_customizer=_customize_response,
)
