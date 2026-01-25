export const CV2_COLOR_RGB2GRAY = 7;

export interface OpencvParamDefinition {
    name: string;
    type: 'number' | 'text' | 'select' | 'tuple';
    options?: { label: string; value: number | string }[];
    defaultValue?: any;
    label?: string; // Display label (uses name if omitted)
}

export interface OpencvFunctionConfig {
    description: string;
    params: OpencvParamDefinition[];
}

export const OPENCV_FUNCTIONS_CONFIG: Record<string, OpencvFunctionConfig> = {
    'grayscale': {
        description: 'グレースケールに変換します（cv2.COLOR_BGR2GRAY固定）。閾値を指定すると二値化も行います。',
        params: [
            {
                name: 'enableThreshold',
                type: 'select',
                options: [
                    { label: 'OFF', value: 0 },
                    { label: 'ON', value: 1 }
                ],
                defaultValue: 0,
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
            { name: 'ksize', type: 'tuple', defaultValue: [5, 5], label: 'ksize (width, height)' },
            { name: 'sigmaX', type: 'number', defaultValue: 0 },
            { name: 'sigmaY', type: 'number', defaultValue: 0 }
        ]
    }
};
