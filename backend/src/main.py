from flask import Flask, request, jsonify, send_from_directory
import os
import logging

# Import function modules
# api package is assumed to be in the same directory
from api.createclahe import main as createclahe
from api.grayscale import main as grayscale
from api.gaussian_blur import main as gaussian_blur
from api.remove_noise import main as remove_noise
from api.restore_contrast import main as restore_contrast
from api.restore_brightness import main as restore_brightness
from api.model_inference import main as model_inference

from flask_cors import CORS

# ロギング設定
log_level = os.environ.get(
    "LOG_LEVEL", "DEBUG" if os.environ.get("FLASK_DEBUG") else "INFO"
)
logging.basicConfig(
    level=getattr(logging, log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
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


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/favicon.ico")
def favicon():
    """backend/imgs/favicon.ico を配信"""
    # main.pyと同じディレクトリ(src)のimgsディレクトリを取得
    base_dir = os.path.dirname(os.path.abspath(__file__))
    imgs_dir = os.path.join(base_dir, "imgs")
    return send_from_directory(
        imgs_dir, "favicon.ico", mimetype="image/vnd.microsoft.icon"
    )


@app.route("/health")
def health_check():
    """ヘルスチェック用エンドポイント"""
    return jsonify({"status": "healthy"}), 200


@app.route("/api/createclahe", methods=["POST"])
def route_createclahe():
    """
    createclahe/main.py の apply_clahe を呼び出すラッパー
    """
    logger.info(
        f"[createclahe] Request received - form: {dict(request.form)}, files: {list(request.files.keys())}"
    )
    try:
        result = createclahe.apply_clahe(request)
        logger.info("[createclahe] Processing completed successfully")
        return result
    except Exception as e:
        logger.error(f"[createclahe] Error: {str(e)}", exc_info=True)
        raise


@app.route("/api/grayscale", methods=["POST"])
def route_grayscale():
    """
    grayscale/main.py の transform_grayscale を呼び出すラッパー
    """
    logger.info(
        f"[grayscale] Request received - form: {dict(request.form)}, files: {list(request.files.keys())}"
    )
    try:
        result = grayscale.transform_grayscale(request)
        logger.info("[grayscale] Processing completed successfully")
        return result
    except Exception as e:
        logger.error(f"[grayscale] Error: {str(e)}", exc_info=True)
        raise


@app.route("/api/gaussian_blur", methods=["POST"])
def route_gaussian_blur():
    """
    gaussian_blur/main.py の apply_gaussian_blur を呼び出すラッパー
    """
    logger.info(
        f"[gaussian_blur] Request received - form: {dict(request.form)}, files: {list(request.files.keys())}"
    )
    try:
        result = gaussian_blur.apply_gaussian_blur(request)
        logger.info("[gaussian_blur] Processing completed successfully")
        return result
    except Exception as e:
        logger.error(f"[gaussian_blur] Error: {str(e)}", exc_info=True)
        raise


@app.route("/api/remove_noise", methods=["POST"])
def route_remove_noise():
    """
    remove_noise/main.py の remove_noise を呼び出すラッパー
    """
    logger.info(
        f"[remove_noise] Request received - form: {dict(request.form)}, files: {list(request.files.keys())}"
    )
    try:
        result = remove_noise.remove_noise(request)
        logger.info("[remove_noise] Processing completed successfully")
        return result
    except Exception as e:
        logger.error(f"[remove_noise] Error: {str(e)}", exc_info=True)
        raise


@app.route("/api/restore_contrast", methods=["POST"])
def route_restore_contrast():
    """
    restore_contrast/main.py の restore_contrast を呼び出すラッパー
    """
    logger.info(
        f"[restore_contrast] Request received - form: {dict(request.form)}, files: {list(request.files.keys())}"
    )
    try:
        result = restore_contrast.restore_contrast(request)
        logger.info("[restore_contrast] Processing completed successfully")
        return result
    except Exception as e:
        logger.error(f"[restore_contrast] Error: {str(e)}", exc_info=True)
        raise


@app.route("/api/restore_brightness", methods=["POST"])
def route_restore_brightness():
    """
    restore_brightness/main.py の restore_brightness を呼び出すラッパー
    """
    logger.info(
        f"[restore_brightness] Request received - form: {dict(request.form)}, files: {list(request.files.keys())}"
    )
    try:
        result = restore_brightness.restore_brightness(request)
        logger.info("[restore_brightness] Processing completed successfully")
        return result
    except Exception as e:
        logger.error(f"[restore_brightness] Error: {str(e)}", exc_info=True)
        raise


@app.route("/api/model_inference", methods=["POST"])
def route_model_inference():
    """
    model_inference/main.py の apply_model_inference を呼び出すラッパー
    """
    logger.info(
        f"[model_inference] Request received - form: {dict(request.form)}, files: {list(request.files.keys())}"
    )
    try:
        result = model_inference.apply_model_inference(request)
        logger.info("[model_inference] Processing completed successfully")
        return result
    except Exception as e:
        logger.error(f"[model_inference] Error: {str(e)}", exc_info=True)
        raise


if __name__ == "__main__":
    # ローカル開発用
    log_env_vars()
    logger.info("Starting Flask server on 0.0.0.0:8080")
    app.run(host="0.0.0.0", port=8080, debug=True)
