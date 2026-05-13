"""Google Cloud Storage client for downloading the model checkpoint."""

import logging
import os

logger = logging.getLogger(__name__)


def download_model_from_gcs(dest_path: str) -> None:
    """Download the Patchcore checkpoint from GCS to ``dest_path``.

    The bucket and blob path are resolved from ``MODEL_GCS_BUCKET`` and
    ``MODEL_GCS_PATH``. GCS is only used for shipping the model checkpoint,
    so the env-var contract lives here rather than at the call site.

    Raises:
        RuntimeError: When either env var is unset.
    """
    bucket_name = os.environ.get("MODEL_GCS_BUCKET")
    blob_path = os.environ.get("MODEL_GCS_PATH")
    if not bucket_name or not blob_path:
        raise RuntimeError(
            "MODEL_GCS_BUCKET / MODEL_GCS_PATH env vars are not set"
        )

    from google.cloud import storage as gcs

    logger.info(f"Downloading model from gs://{bucket_name}/{blob_path} ...")
    client = gcs.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)
    blob.download_to_filename(dest_path)
    logger.info(f"Model downloaded to {dest_path}")
