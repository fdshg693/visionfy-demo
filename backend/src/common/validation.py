"""Enhanced file validation"""

import filetype
from werkzeug.datastructures import FileStorage
from flask import Response
from typing import Optional
from .config import config
from .response import create_error_response


def validate_image_file(file: FileStorage) -> Optional[Response]:
    """
    画像ファイルの検証

    Returns:
        エラーがある場合はResponseオブジェクト、問題なければNone
    """
    # 1. ファイル名チェック
    if not file.filename or file.filename == "":
        return create_error_response("Empty filename", 400, "EMPTY_FILENAME")

    # 2. 拡張子チェック
    ext = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else ""
    if ext not in config.ALLOWED_EXTENSIONS:
        return create_error_response(
            f"Invalid file type. Allowed: {', '.join(sorted(config.ALLOWED_EXTENSIONS))}",
            400,
            "INVALID_FILE_TYPE",
        )

    # 3. MIMEタイプチェック（マジックナンバー）
    file.seek(0)
    header = file.read(512)
    file.seek(0)

    kind = filetype.guess(header)
    if not kind or kind.extension not in {"jpg", "jpeg", "png", "bmp", "tiff", "tif"}:
        return create_error_response(
            "File content does not match image format", 400, "INVALID_IMAGE_FORMAT"
        )

    return None
