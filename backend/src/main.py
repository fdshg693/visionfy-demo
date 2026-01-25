from flask import Flask, request, jsonify, redirect, send_from_directory
import os

# Import function modules
# api package is assumed to be in the same directory
from api.createclane import main as createclane


from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    return redirect("/health")


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


@app.route("/api/createclane", methods=["GET", "POST", "PUT", "DELETE"])
def route_createclane():
    """
    createclane/main.py の change_image1 を呼び出すラッパー
    """
    return createclane.change_image1(request)


if __name__ == "__main__":
    # ローカル開発用
    app.run(host="0.0.0.0", port=8080, debug=True)
