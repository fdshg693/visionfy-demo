import os
import time
import logging

from flask import jsonify

logger = logging.getLogger(__name__)

GCS_MOUNT_PATH = os.environ.get("GCS_MOUNT_PATH", "/gcs_upload")
TEST_FILE_NAME = "test.txt"


def check_gcs_connectivity():
    """GCSマウントの疎通確認を行う"""
    result = {
        "mount_path": GCS_MOUNT_PATH,
        "mount_exists": False,
        "read_ok": False,
        "write_ok": False,
        "read_content": None,
        "errors": [],
    }

    # 1. マウントパスの存在確認
    if not os.path.isdir(GCS_MOUNT_PATH):
        result["errors"].append(f"Mount path does not exist: {GCS_MOUNT_PATH}")
        logger.error(f"[gcs_check] Mount path does not exist: {GCS_MOUNT_PATH}")
        return jsonify(result), 503

    result["mount_exists"] = True
    logger.info(f"[gcs_check] Mount path exists: {GCS_MOUNT_PATH}")

    # 2. test.txt の読み取り確認
    test_file_path = os.path.join(GCS_MOUNT_PATH, TEST_FILE_NAME)
    try:
        with open(test_file_path, "r", encoding="utf-8") as f:
            content = f.read()
        result["read_ok"] = True
        result["read_content"] = content.strip()
        logger.info(f"[gcs_check] Successfully read {test_file_path}")
    except Exception as e:
        result["errors"].append(f"Failed to read {test_file_path}: {str(e)}")
        logger.error(f"[gcs_check] Read failed: {str(e)}")

    # 3. 書き込み確認（一時ファイルを作成して削除）
    tmp_file_name = f"_gcs_check_{int(time.time())}.tmp"
    tmp_file_path = os.path.join(GCS_MOUNT_PATH, tmp_file_name)
    try:
        with open(tmp_file_path, "w", encoding="utf-8") as f:
            f.write("gcs connectivity check")
        os.remove(tmp_file_path)
        result["write_ok"] = True
        logger.info("[gcs_check] Write/delete test passed")
    except Exception as e:
        result["errors"].append(f"Failed to write {tmp_file_path}: {str(e)}")
        logger.error(f"[gcs_check] Write failed: {str(e)}")

    all_ok = result["read_ok"] and result["write_ok"]
    status_code = 200 if all_ok else 503

    return jsonify(result), status_code
