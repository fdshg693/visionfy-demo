from flask import make_response
import cv2
import numpy as np


def transform_grayscale(request):
    """
    画像を受け取り、グレースケール変換を適用して返す
    """
    if request.method != "POST":
        return "Method not allowed", 405

    if "file" not in request.files:
        return "No file part", 400

    file = request.files["file"]
    if file.filename == "":
        return "No selected file", 400

    try:
        # Parse optional parameters
        threshold = request.form.get("threshold")

        # Read image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return "Could not decode image", 400

        # Apply Grayscale
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply Threshold if provided
        if threshold:
            try:
                thresh_val = float(threshold)
                _, img = cv2.threshold(img, thresh_val, 255, cv2.THRESH_BINARY)
            except ValueError:
                return "Invalid threshold value", 400

        # Encode back to format (JPG)
        ret, buffer = cv2.imencode(".jpg", img)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"
        return response

    except Exception as e:
        return f"Internal Server Error: {str(e)}", 500
