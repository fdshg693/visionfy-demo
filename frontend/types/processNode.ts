import type { ExecutionStatusValue } from '@/constants/index';
import { PROCESS_FUNCTIONS_BASE } from './processFunctionBase';

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

// ====================== 7. Model Inference (Patchcore Anomaly Detection) ======================
export interface ModelInferenceParams {
    overlayAlpha: number;
    heatmapAlpha: number;
}
export interface ModelInferenceData extends BaseProcessNodeData {
    functionName: 'model_inference';
    params: ModelInferenceParams;
}

/** Nodeの種類・パラメータを表す型 */
export type ProcessNodeData = CLAHEData | GaussianBlurData | GrayscaleData | RemoveNoiseData | RestoreBrightnessData | RestoreContrastData | ModelInferenceData;

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
    model_inference: ModelInferenceParams;
};

/** 処理ノードのパラメータ群型 */
export type ProcessNodeParams = ProcessNodeParamsMap[ProcessNodeFunctionName];

/**
 * デフォルトパラメータ
 * processFunctionBase.ts の PROCESS_FUNCTIONS_BASE から自動生成
 */
export const DEFAULT_NODE_PARAMS: ProcessNodeParamsMap = Object.fromEntries(
    Object.entries(PROCESS_FUNCTIONS_BASE).map(([functionName, definition]) => [
        functionName,
        Object.fromEntries(
            Object.entries(definition.params).map(([paramName, paramDef]) => [
                paramName,
                paramDef.defaultValue,
            ])
        ),
    ])
) as unknown as ProcessNodeParamsMap;

/**
 * アイコンマッピング
 * processFunctionBase.ts の PROCESS_FUNCTIONS_BASE から自動生成
 */
export const DEFAULT_NODE_ICONS: Record<ProcessNodeFunctionName, string> = Object.fromEntries(
    Object.entries(PROCESS_FUNCTIONS_BASE).map(([functionName, definition]) => [
        functionName,
        definition.icon,
    ])
) as Record<ProcessNodeFunctionName, string>;
