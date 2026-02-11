"""Application configuration"""

import os
from dataclasses import dataclass


@dataclass
class Config:
    """Application configuration"""

    # ファイルアップロード
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS: frozenset = frozenset({"jpg", "jpeg", "png", "bmp", "tiff"})

    # 画像処理
    MAX_IMAGE_DIMENSION: int = 4096  # 最大画像サイズ（幅・高さ）

    # モデル推論
    MODEL_INPUT_SIZE: tuple[int, int] = (256, 256)
    HEATMAP_COLORMAP: int = 2  # cv2.COLORMAP_JET

    # ノイズ除去
    MEDIAN_BLUR_KERNEL_SIZE: int = 3

    @classmethod
    def from_env(cls) -> "Config":
        """環境変数から設定を読み込み"""
        return cls(
            MAX_CONTENT_LENGTH=int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)),
            # 他の設定値も環境変数から読み込み可能に拡張可能
        )


# グローバルインスタンス
config = Config.from_env()
