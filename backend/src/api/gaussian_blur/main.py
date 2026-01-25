from flask import make_response
import cv2
import numpy as np


def apply_gaussian_blur(request):
    """
    画像を受け取り、ガウシアンブラーを適用して返す
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
        try:
            # Gaussian Blur parameters
            ksize = int(request.form.get("ksize", 0))
            sigma = float(request.form.get("sigma", 0))

        except ValueError:
            return (
                "Invalid parameters: ksize uses int, sigma uses float",
                400,
            )

        # Read image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return "Could not decode image", 400

        # Apply Gaussian Blur
        if ksize > 0 or sigma > 0:
            # If ksize is provided and positive, ensure it is odd
            if ksize > 0 and ksize % 2 == 0:
                ksize += 1

            img = cv2.GaussianBlur(img, (ksize, ksize), sigma)

        # Encode back to format (JPG)
        ret, buffer = cv2.imencode(".jpg", img)

        if not ret:
            return "Could not encode image", 500

        response = make_response(buffer.tobytes())
        response.headers["Content-Type"] = "image/jpeg"
        return response

    except Exception as e:
        return f"Internal Server Error: {str(e)}", 500
