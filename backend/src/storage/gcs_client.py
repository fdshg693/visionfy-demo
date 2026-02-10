"""Google Cloud Storage client for downloading model files."""

import logging

logger = logging.getLogger(__name__)


def download_from_gcs(bucket_name: str, blob_path: str, dest_path: str) -> None:
    """Download a file from GCS to a local path.

    Args:
        bucket_name: GCS bucket name
        blob_path: Path to blob within bucket
        dest_path: Local destination path
    """
    from google.cloud import storage as gcs

    logger.info(f"Downloading model from gs://{bucket_name}/{blob_path} ...")
    client = gcs.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)
    blob.download_to_filename(dest_path)
    logger.info(f"Model downloaded to {dest_path}")
