import type { ExecutionStatusValue } from '@/constants/index';

/**
 * 全てのNodeで共通する基本データ構造 
 * 各Nodeは、functionNameとparamsで特定の処理内容を定義する  
*/
export interface BaseProcessNodeData extends Record<string, unknown> {
    label: string;
    executionStatus?: ExecutionStatusValue;
    icon?: string;
    result?: string; // base64 image of the execution result
    resultParams?: Record<string, unknown>; // params used to generate the result
}

// ====================== 1. CLAHE (Adaptive Histogram Equalization) ====================== 
export interface CLAHEParams {
    clipLimit: number;
    tileGridSize: [number, number];
}
export interface CLAHEData extends BaseProcessNodeData {
    functionName: 'createclahe';
    params: CLAHEParams;
}

// ====================== 2. GaussianBlur ======================
export interface GaussianBlurParams {
    ksize: [number, number]; // Must be odd
    sigmaX: number;
    sigmaY: number;
}
export interface GaussianBlurData extends BaseProcessNodeData {
    functionName: 'gaussianblur';
    params: GaussianBlurParams;
}

// ====================== 3. Grayscale (cv2.cvtColor BGR2GRAY + optional threshold) ======================
export interface GrayscaleParams {
    enableThreshold: boolean; // Whether to apply thresholding
    threshold: number; // 0-255, thresholding after grayscale conversion
}
export interface GrayscaleData extends BaseProcessNodeData {
    functionName: 'grayscale';
    params: GrayscaleParams;
}

// ====================== 4. Remove Noise (cv2.medianBlur) ======================
export type RemoveNoiseParams = Record<string, never>;
export interface RemoveNoiseData extends BaseProcessNodeData {
    functionName: 'remove_noise';
    params: RemoveNoiseParams;
}

// ====================== 5. Restore Brightness ======================
export interface RestoreBrightnessParams {
    value: number;
}
export interface RestoreBrightnessData extends BaseProcessNodeData {
    functionName: 'restore_brightness';
    params: RestoreBrightnessParams;
}

// ====================== 6. Restore Contrast (Gamma Correction) ======================
export interface RestoreContrastParams {
    gamma: number;
}
export interface RestoreContrastData extends BaseProcessNodeData {
    functionName: 'restore_contrast';
    params: RestoreContrastParams;
}

/** Nodeの種類・パラメータを表す型 */
export type ProcessNodeData = CLAHEData | GaussianBlurData | GrayscaleData | RemoveNoiseData | RestoreBrightnessData | RestoreContrastData;

/** 処理ノードで使用される関数名のユニオン型 */
export type ProcessNodeFunctionName = ProcessNodeData['functionName'];

/** 処理ノードのデータ更新用部分型 */
export type NodeDataUpdate = Partial<BaseProcessNodeData> & {
    functionName?: ProcessNodeFunctionName;
    params?: ProcessNodeParams;
};

/** 処理ノードのパラメータ群マッピング型 */
export type ProcessNodeParamsMap = {
    createclahe: CLAHEParams;
    gaussianblur: GaussianBlurParams;
    grayscale: GrayscaleParams;
    remove_noise: RemoveNoiseParams;
    restore_brightness: RestoreBrightnessParams;
    restore_contrast: RestoreContrastParams;
};

/** 処理ノードのパラメータ群型 */
export type ProcessNodeParams = ProcessNodeParamsMap[ProcessNodeFunctionName];

export const DEFAULT_NODE_PARAMS: ProcessNodeParamsMap = {
    createclahe: { clipLimit: 40.0, tileGridSize: [8, 8] },
    gaussianblur: { ksize: [5, 5], sigmaX: 0, sigmaY: 0 },
    grayscale: { enableThreshold: false, threshold: 128 },
    remove_noise: {},
    restore_brightness: { value: -30 },
    restore_contrast: { gamma: 1.7 },
};

// Icon mapping for each function
export const DEFAULT_NODE_ICONS: Record<ProcessNodeFunctionName, string> = {
    createclahe: 'histogram',
    gaussianblur: 'brush',
    grayscale: 'palette',
    remove_noise: 'settings',
    restore_brightness: 'image',
    restore_contrast: 'image',
};
