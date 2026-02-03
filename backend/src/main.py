from flask import Flask, request, jsonify, send_from_directory
import os

# Import function modules
# api package is assumed to be in the same directory
from api.createclahe import main as createclahe
from api.grayscale import main as grayscale
from api.gaussian_blur import main as gaussian_blur


from flask_cors import CORS

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
    return createclahe.apply_clahe(request)


@app.route("/api/grayscale", methods=["POST"])
def route_grayscale():
    """
    grayscale/main.py の transform_grayscale を呼び出すラッパー
    """
    return grayscale.transform_grayscale(request)


@app.route("/api/gaussian_blur", methods=["POST"])
def route_gaussian_blur():
    """
    gaussian_blur/main.py の apply_gaussian_blur を呼び出すラッパー
    """
    return gaussian_blur.apply_gaussian_blur(request)


if __name__ == "__main__":
    # ローカル開発用
    app.run(host="0.0.0.0", port=8080, debug=True)
