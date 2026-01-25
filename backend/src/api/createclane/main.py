from flask import make_response
import cv2
import numpy as np


def change_image1(request):
    """
    画像を受け取り、CLAHE変換を適用して返す
    reference: infra/reference/simple.py
    """
    if request.method != "POST":
        return "Method not allowed", 405

    # Check if image is present
    # 一般的なフォームデータとしてのアップロードを想定
    if "file" not in request.files:
        return "No file part", 400

    file = request.files["file"]
    if file.filename == "":
        return "No selected file", 400

    try:
        # Parse optional parameters
        try:
            clip_limit = float(request.form.get("clipLimit", 2.0))
            tile_grid_x = int(request.form.get("tileGridSizeX", 8))
            tile_grid_y = int(request.form.get("tileGridSizeY", 8))
        except ValueError:
            return (
                "Invalid parameters: clipLimit must be float, tileGridSize must be int",
                400,
            )

        # Read image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        # Decode as grayscale (0 flag mimics the reference: cv2.imread("original.png", 0))
        img = cv2.imdecode(file_bytes, 0)

        if img is None:
            return "Could not decode image", 400

        # create a CLAHE object (Arguments are optional).
        clahe = cv2.createCLAHE(
            clipLimit=clip_limit, tileGridSize=(tile_grid_x, tile_grid_y)
        )
        cl1 = clahe.apply(img)

        # Encode back to format (e.g., JPG)
        # The reference saved as "clahe_histogram.jpg"
        ret, buffer = cv2.imencode(".jpg", cl1)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"
        return response

    except Exception as e:
        return f"Internal Server Error: {str(e)}", 500
