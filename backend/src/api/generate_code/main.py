"""
Pythonコード生成モジュール

SimpleWorkflow形式のワークフロー定義を受け取り、
同等の処理を行うスタンドアロンPythonスクリプトを生成して返す。
"""

import logging
from flask import Request, jsonify

from common.response import create_error_response


logger = logging.getLogger(__name__)


# サポートする関数名のセット
SUPPORTED_FUNCTIONS = {
    "createclahe",
    "gaussianblur",
    "grayscale",
    "remove_noise",
    "restore_brightness",
    "restore_contrast",
}


# --- 関数定義テンプレート ---

FUNCTION_DEFS = {
    "createclahe": '''\
def apply_clahe(img, clip_limit=2.0, tile_grid_size=(8, 8)):
    """CLAHE（コントラスト制限適応ヒストグラム均等化）を適用"""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    result = clahe.apply(gray)
    return result
''',
    "gaussianblur": '''\
def apply_gaussian_blur(img, ksize_x=0, ksize_y=0, sigma_x=0.0, sigma_y=0.0):
    """ガウシアンブラーを適用"""
    if ksize_x > 0 or ksize_y > 0 or sigma_x > 0:
        # OpenCVはカーネルサイズが奇数である必要がある
        kx = ksize_x + (1 if ksize_x > 0 and ksize_x % 2 == 0 else 0)
        ky = ksize_y + (1 if ksize_y > 0 and ksize_y % 2 == 0 else 0)
        return cv2.GaussianBlur(img, (kx, ky), sigma_x, sigmaY=sigma_y)
    return img
''',
    "grayscale": '''\
def apply_grayscale(img, threshold=None):
    """グレースケール変換（オプションで二値化閾値を適用）"""
    result = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    if threshold is not None:
        _, result = cv2.threshold(result, threshold, 255, cv2.THRESH_BINARY)
    return result
''',
    "remove_noise": '''\
def apply_remove_noise(img):
    """メディアンフィルタによるノイズ除去（カーネルサイズ: 3）"""
    return cv2.medianBlur(img, 3)
''',
    "restore_brightness": '''\
def apply_restore_brightness(img, value=-30):
    """明るさ補正（valueを減算: 負の値で明るく、正の値で暗く）"""
    if value != 0:
        img_f = img.astype(np.float32)
        img_f = img_f - value
        return np.clip(img_f, 0, 255).astype(np.uint8)
    return img
''',
    "restore_contrast": '''\
def apply_restore_contrast(img, gamma=1.7):
    """ガンマ補正によるコントラスト復元"""
    safe_gamma = gamma if gamma > 0 else 1.0
    inv_gamma = 1.0 / safe_gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
    return cv2.LUT(img, table)
''',
}


# --- 呼び出しコード生成 ---

def _build_call_code(step_num: int, function_name: str, params: dict) -> str:
    """各ステップの呼び出しコードを生成"""
    if function_name == "createclahe":
        clip_limit = params.get("clipLimit", 2.0)
        tile_grid_size = params.get("tileGridSize", [8, 8])
        return (
            f"# Step {step_num}: CLAHE\n"
            f"img = apply_clahe(img, clip_limit={clip_limit}, tile_grid_size=({tile_grid_size[0]}, {tile_grid_size[1]}))"
        )

    if function_name == "gaussianblur":
        ksize = params.get("ksize", [0, 0])
        sigma_x = params.get("sigmaX", 0.0)
        sigma_y = params.get("sigmaY", 0.0)
        return (
            f"# Step {step_num}: Gaussian Blur\n"
            f"img = apply_gaussian_blur(img, ksize_x={ksize[0]}, ksize_y={ksize[1]}, sigma_x={sigma_x}, sigma_y={sigma_y})"
        )

    if function_name == "grayscale":
        enable_threshold = params.get("enableThreshold", False)
        threshold = params.get("threshold", 128)
        if enable_threshold:
            return (
                f"# Step {step_num}: Grayscale + Binary Threshold\n"
                f"img = apply_grayscale(img, threshold={threshold})"
            )
        return (
            f"# Step {step_num}: Grayscale\n"
            f"img = apply_grayscale(img)"
        )

    if function_name == "remove_noise":
        return (
            f"# Step {step_num}: Noise Removal (Median Blur)\n"
            f"img = apply_remove_noise(img)"
        )

    if function_name == "restore_brightness":
        value = params.get("value", -30)
        return (
            f"# Step {step_num}: Brightness Adjustment\n"
            f"img = apply_restore_brightness(img, value={value})"
        )

    if function_name == "restore_contrast":
        gamma = params.get("gamma", 1.7)
        return (
            f"# Step {step_num}: Contrast (Gamma Correction)\n"
            f"img = apply_restore_contrast(img, gamma={gamma})"
        )

    return f"# Step {step_num}: Unknown function '{function_name}' (skipped)"


def generate_code(request: Request):
    """
    SimpleWorkflowを受け取りPythonコードを生成するエンドポイント

    Request body (JSON):
        {
            "processNodes": [
                { "functionName": "createclahe", "params": { "clipLimit": 40 } },
                ...
            ]
        }

    Response (JSON):
        { "code": "import cv2\\n..." }
    """
    try:
        data = request.get_json(silent=True)
    except Exception:
        data = None

    if not data:
        return create_error_response("Invalid JSON body", 400, "INVALID_JSON")

    process_nodes = data.get("processNodes")
    if not isinstance(process_nodes, list):
        return create_error_response(
            "processNodes must be an array", 400, "INVALID_FORMAT"
        )

    if len(process_nodes) == 0:
        return create_error_response(
            "processNodes must not be empty", 400, "EMPTY_WORKFLOW"
        )

    # 使用する関数を特定（重複排除、順序保持）
    used_functions: list[str] = []
    skipped_functions: list[str] = []

    for node in process_nodes:
        fn = node.get("functionName", "")
        if fn in SUPPORTED_FUNCTIONS:
            if fn not in used_functions:
                used_functions.append(fn)
        else:
            if fn not in skipped_functions:
                skipped_functions.append(fn)

    # --- コード組み立て ---
    lines: list[str] = []

    # ヘッダー
    lines.append('"""')
    lines.append("Auto-generated image processing pipeline")
    lines.append(f"Steps: {len(process_nodes)}")
    lines.append('"""')
    lines.append("")
    lines.append("import cv2")
    lines.append("import numpy as np")
    lines.append("")
    lines.append("")

    # 使用する関数の定義のみ含める
    for fn in used_functions:
        lines.append(FUNCTION_DEFS[fn])
        lines.append("")

    # メイン処理
    lines.append("# --- Main Pipeline ---")
    lines.append('img = cv2.imread("input.jpg")')
    lines.append("if img is None:")
    lines.append('    raise FileNotFoundError("input.jpg が見つかりません")')
    lines.append("")

    # スキップされた関数のコメント
    if skipped_functions:
        lines.append(
            f"# NOTE: 以下の関数はコード生成未対応のためスキップされました: {', '.join(skipped_functions)}"
        )
        lines.append("")

    # 各ステップの呼び出し
    step_num = 1
    for node in process_nodes:
        fn = node.get("functionName", "")
        params = node.get("params") or {}
        if fn in SUPPORTED_FUNCTIONS:
            lines.append(_build_call_code(step_num, fn, params))
            lines.append("")
        else:
            lines.append(
                f"# Step {step_num}: {fn} (未対応のためスキップ)"
            )
            lines.append("")
        step_num += 1

    # 出力
    lines.append('cv2.imwrite("output.jpg", img)')
    lines.append('print("処理完了: output.jpg")')

    code = "\n".join(lines)

    logger.info(
        f"Generated Python code: {len(process_nodes)} steps, "
        f"{len(used_functions)} functions, {len(skipped_functions)} skipped"
    )

    return jsonify({"code": code})
