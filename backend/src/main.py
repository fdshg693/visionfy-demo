from flask import Flask, request, jsonify, send_from_directory
import os
import logging
from werkzeug.exceptions import RequestEntityTooLarge

# Import function modules
from api.createclahe import main as createclahe
from api.grayscale import main as grayscale
from api.gaussian_blur import main as gaussian_blur
from api.remove_noise import main as remove_noise
from api.restore_contrast import main as restore_contrast
from api.restore_brightness import main as restore_brightness
from api.model_inference import main as model_inference
from api.generate_code import main as generate_code

from common.decorators import image_endpoint, json_endpoint
from common.config import config
from common.response import create_error_response

from flask_cors import CORS

# ロギング設定
log_level = os.environ.get(
    "LOG_LEVEL", "DEBUG" if os.environ.get("FLASK_DEBUG") else "INFO"
)
logging.basicConfig(
    level=getattr(logging, log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    force=True,  # Gunicorn環境でも既存ハンドラを上書き
)
logger = logging.getLogger(__name__)


# 起動時に環境変数をログ出力
def log_env_vars():
    """重要な環境変数のログ出力（機密情報はマスク）"""
    env_vars = {
        "FLASK_DEBUG": os.environ.get("FLASK_DEBUG"),
        "LOG_LEVEL": os.environ.get("LOG_LEVEL"),
        "PORT": os.environ.get("PORT"),
    }
    for name, value in env_vars.items():
        if value:
            logger.info(f"Environment variable {name}={value}")
        else:
            logger.warning(f"Environment variable {name} is not set")


app = Flask(__name__, static_url_path="", static_folder="static")
CORS(app)

# ファイルサイズ制限を設定（configから読み込み）
app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH

# 起動時ログ出力（Gunicorn環境でも実行されるようモジュールレベルで呼び出し）
log_env_vars()


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/favicon.ico")
def favicon():
    """backend/imgs/favicon.ico を配信"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    imgs_dir = os.path.join(base_dir, "imgs")
    return send_from_directory(
        imgs_dir, "favicon.ico", mimetype="image/vnd.microsoft.icon"
    )


@app.route("/health")
def health_check():
    """ヘルスチェック用エンドポイント"""
    return jsonify({"status": "healthy"}), 200


@app.errorhandler(413)
@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(error):
    """ファイルサイズ超過時のエラーハンドリング"""
    max_size_mb = config.MAX_CONTENT_LENGTH / (1024 * 1024)
    logger.warning(f"File size exceeded: {error}")
    return create_error_response(
        f"File too large. Maximum size: {max_size_mb:.0f}MB",
        413,
        "FILE_TOO_LARGE",
    )


@app.route("/api/createclahe", methods=["POST"])
@image_endpoint("createclahe")
def route_createclahe():
    return createclahe.apply_clahe(request)


@app.route("/api/grayscale", methods=["POST"])
@image_endpoint("grayscale")
def route_grayscale():
    return grayscale.transform_grayscale(request)


@app.route("/api/gaussian_blur", methods=["POST"])
@image_endpoint("gaussian_blur")
def route_gaussian_blur():
    return gaussian_blur.apply_gaussian_blur(request)


@app.route("/api/remove_noise", methods=["POST"])
@image_endpoint("remove_noise")
def route_remove_noise():
    return remove_noise.remove_noise(request)


@app.route("/api/restore_contrast", methods=["POST"])
@image_endpoint("restore_contrast")
def route_restore_contrast():
    return restore_contrast.restore_contrast(request)


@app.route("/api/restore_brightness", methods=["POST"])
@image_endpoint("restore_brightness")
def route_restore_brightness():
    return restore_brightness.restore_brightness(request)


@app.route("/api/model_inference", methods=["POST"])
@image_endpoint("model_inference")
def route_model_inference():
    return model_inference.apply_model_inference(request)


@app.route("/api/generate_code", methods=["POST"])
@json_endpoint("generate_code")
def route_generate_code():
    """ワークフローからPythonコードを生成"""
    return generate_code.generate_code(request)


def validate_env_vars() -> None:
    """必須環境変数の検証"""
    # MODEL_GCS_BUCKETとMODEL_GCS_PATHは/api/model_inferenceでのみ必要
    # 他のエンドポイントでは不要なので、ここでは警告のみ
    env_vars_optional = ["MODEL_GCS_BUCKET", "MODEL_GCS_PATH"]

    for var in env_vars_optional:
        if not os.getenv(var):
            logger.warning(
                f"Optional environment variable {var} is not set. "
                "Required for /api/model_inference endpoint."
            )


# 起動時検証（Gunicorn環境でも実行されるようモジュールレベルで呼び出し）
validate_env_vars()


if __name__ == "__main__":
    # ローカル開発用
    logger.info("Starting Flask server on 0.0.0.0:8080")
    app.run(host="0.0.0.0", port=8080, debug=True)
