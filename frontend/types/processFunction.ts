export const CV2_COLOR_RGB2GRAY = 7;

export type OpencvParamValue = number | string | boolean | [number, number];

export interface OpencvParamDefinition {
    name: string;
    /** 入力パラメータのタイプ */
    type: 'number' | 'text' | 'select' | 'tuple' | 'boolean';
    options?: { label: string; value: number | string | boolean }[];
    defaultValue?: OpencvParamValue;
    label?: string; // Display label (uses name if omitted)
    /** Input step increment (e.g. 2 for odd-only when min is 1) */
    step?: number;
    /** Minimum allowed value */
    min?: number;
}

export interface OpencvFunctionConfig {
    description: string;
    params: OpencvParamDefinition[];
}

/**
 * OpenCV関数ごとの設定定義。
 * - key: 関数名
 * - value: 関数の説明とパラメータ定義
 * - value.description: 関数の説明文
 * - value.params: 各パラメータの名前、タイプ、デフォルト値など
 */
export const VISIONFY_FUNCTIONS_CONFIG: Record<string, OpencvFunctionConfig> = {
    'grayscale': {
        description: 'グレースケールに変換します（cv2.COLOR_BGR2GRAY固定）。閾値を指定すると二値化も行います。',
        params: [
            {
                name: 'enableThreshold',
                type: 'boolean',
                defaultValue: false,
                label: 'Threshold'
            },
            {
                name: 'threshold',
                type: 'number',
                defaultValue: 128,
                label: 'Threshold Value (0-255)'
            }
        ]
    },
    'createclahe': {
        description: 'コントラスト制限付き適応的ヒストグラム平坦化（CLAHE）を作成します。',
        params: [
            { name: 'clipLimit', type: 'number', defaultValue: 40.0 },
            { name: 'tileGridSize', type: 'tuple', defaultValue: [8, 8], label: 'tileGridSize (x, y)' }
        ]
    },
    'gaussianblur': {
        description: 'ガウシアンフィルタを用いて画像をぼかします。',
        params: [
            { name: 'ksize', type: 'tuple', defaultValue: [5, 5], label: 'ksize (width, height)', step: 2, min: 1 },
            { name: 'sigmaX', type: 'number', defaultValue: 0 },
            { name: 'sigmaY', type: 'number', defaultValue: 0 }
        ]
    },
    'remove_noise': {
        description: 'メディアンフィルタを用いてノイズを除去します。パラメータは不要です。',
        params: []
    },
    'restore_brightness': {
        description: '明るさを補正します。値が負の場合は明るくし、正の場合は暗くします。',
        params: [
            { name: 'value', type: 'number', defaultValue: -30, label: 'Brightness Value' }
        ]
    },
    'restore_contrast': {
        description: 'ガンマ補正を用いてコントラストを復元します。',
        params: [
            { name: 'gamma', type: 'number', defaultValue: 1.7, label: 'Gamma' }
        ]
    },
    'model_inference': {
        description: 'Patchcoreモデルによる異常検知推論を実行し、ヒートマップオーバーレイを返します。',
        params: [
            { name: 'overlayAlpha', type: 'number', defaultValue: 0.6, label: 'Overlay Alpha', min: 0, step: 0.1 },
            { name: 'heatmapAlpha', type: 'number', defaultValue: 0.4, label: 'Heatmap Alpha', min: 0, step: 0.1 }
        ]
    }
};
