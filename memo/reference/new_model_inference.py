import cv2
import numpy as np
import torch
from anomalib.models import Patchcore
from typing import Dict, Any


def load_model(ckpt_path: str, device: str = None) -> torch.nn.Module:
    """
    Loads the Patchcore model from a checkpoint.

    Args:
        ckpt_path (str): Path to the model checkpoint (.ckpt).
        device (str, optional): Device to load the model on ('cuda' or 'cpu').
                                If None, automatically detects.

    Returns:
        torch.nn.Module: Loaded Pytorch Lightning model in eval mode.
    """
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    model = Patchcore.load_from_checkpoint(ckpt_path, weights_only=False)
    model.eval()
    model.to(device)
    return model


def image2tensor(image: np.ndarray, device: str = "cpu") -> torch.Tensor:
    """
    Converts a numpy image to a PyTorch tensor suitable for inference.
    Resizes to (256, 256), normalizes with ImageNet stats, and adds batch dimension.

    Args:
        image (np.ndarray): Input image (H, W, 3).
        device (str): Device to place the tensor on.

    Returns:
        torch.Tensor: Normalized tensor with shape (1, 3, 256, 256).
    """
    # 1. Resize to 256x256
    img_resized = cv2.resize(image, (256, 256))

    # 2. To Tensor [C, H, W] and Normalize
    # Convert to float [0, 1]
    t_img = torch.from_numpy(img_resized).permute(2, 0, 1).float() / 255.0

    # ImageNet Mean and Std
    device = torch.device(device)
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1).to(device)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1).to(device)

    t_img = t_img.to(device)
    t_img = (t_img - mean) / std

    # Add batch dimension
    batch = t_img.unsqueeze(0)
    return batch


def tensor2image(tensor: torch.Tensor) -> np.ndarray:
    """
    Converts a tensor (e.g., anomaly map) to a numpy array (H, W).

    Args:
        tensor (torch.Tensor): Input tensor.

    Returns:
        np.ndarray: Numpy array.
    """
    return tensor.squeeze().cpu().numpy()


def run_inference(
    image: np.ndarray, model: torch.nn.Module, device: str = None
) -> Dict[str, Any]:
    """
    Runs inference on a single image using the loaded model.
    Internal steps:
      1. image2tensor: converts numpy to tensor (256x256, normalized)
      2. model forward pass
      3. tensor2image: converts anomaly map tensor to numpy

    Args:
        image (np.ndarray): Input image in RGB format (H, W, C).
        model (torch.nn.Module): Loaded Patchcore model.
        device (str, optional): Device to run inference on. If None, uses model's device.

    Returns:
        Dict[str, Any]: Dictionary containing:
            - 'pred_score' (float): Anomaly score.
            - 'anomaly_map' (np.ndarray): Anomaly heatmap (H, W).
    """
    if device is None:
        device = next(model.parameters()).device
    else:
        device = torch.device(device)

    # 1. Convert Image to Tensor
    batch = image2tensor(image, device=str(device))

    # 2. Inference
    with torch.no_grad():
        output = model(batch)

    # Extract results
    if hasattr(output, "pred_score"):
        score = output.pred_score
        anom_map = output.anomaly_map
    elif isinstance(output, dict):
        score = output["pred_score"]
        anom_map = output["anomaly_map"]
    else:
        raise ValueError(f"Unexpected model output type: {type(output)}")

    # 3. Convert Result Tensor to Numpy
    anom_map_np = tensor2image(anom_map)

    return {"pred_score": score.item(), "anomaly_map": anom_map_np}


if __name__ == "__main__":
    import os

    # パスの設定（スクリプトの場所を基準）
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)

    ckpt_path = os.path.join(backend_dir, "model.ckpt")
    image_path = os.path.join(backend_dir, "fish.jpeg")
    output_path = os.path.join(backend_dir, "anomaly_heatmap.png")

    # モデルのロード
    print(f"Loading model from {ckpt_path}...")
    model = load_model(ckpt_path)

    # 画像の読み込み
    print(f"Loading image from {image_path}...")
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found: {image_path}")
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # 推論の実行
    print("Running inference...")
    result = run_inference(image_rgb, model)

    # 結果の表示
    print(f"Anomaly Score: {result['pred_score']:.4f}")

    # ヒートマップの正規化と可視化
    anomaly_map = result["anomaly_map"]
    # 0-255にスケール
    heatmap_normalized = (
        (anomaly_map - anomaly_map.min())
        / (anomaly_map.max() - anomaly_map.min())
        * 255
    ).astype(np.uint8)

    # カラーマップ適用（JET）
    heatmap_colored = cv2.applyColorMap(heatmap_normalized, cv2.COLORMAP_JET)

    # 元の画像サイズにリサイズ
    heatmap_resized = cv2.resize(heatmap_colored, (image.shape[1], image.shape[0]))

    # 元の画像とヒートマップを重ね合わせ
    overlay = cv2.addWeighted(image, 0.6, heatmap_resized, 0.4, 0)

    # 保存
    cv2.imwrite(output_path, overlay)
    print(f"Heatmap saved to {output_path}")
