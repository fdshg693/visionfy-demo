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
    'cvtcolor': {
        description: '色空間をRGBからグレースケールに変換します。',
        params: [
            {
                name: 'code',
                type: 'select',
                options: [
                    { label: 'COLOR_RGB2GRAY', value: CV2_COLOR_RGB2GRAY }
                ],
                defaultValue: CV2_COLOR_RGB2GRAY
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
