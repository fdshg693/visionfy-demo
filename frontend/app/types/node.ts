export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

// Base interface for all process nodes
export interface BaseProcessNodeData extends Record<string, unknown> {
    label: string;
    executionStatus?: ExecutionStatus;
    icon?: string;
    result?: string; // base64 image of the execution result
    resultParams?: Record<string, unknown>; // params used to generate the result
}

// 1. CLAHE (Adaptive Histogram Equalization)
export interface CLAHEParams {
    clipLimit: number;
    tileGridSize: [number, number];
}
export interface CLAHEData extends BaseProcessNodeData {
    functionName: 'createclahe';
    params: CLAHEParams;
}

// 2. GaussianBlur
export interface GaussianBlurParams {
    ksize: [number, number]; // Must be odd
    sigmaX: number;
    sigmaY: number;
}
export interface GaussianBlurData extends BaseProcessNodeData {
    functionName: 'gaussianblur';
    params: GaussianBlurParams;
}

// 3. Grayscale (cv2.cvtColor BGR2GRAY + optional threshold)
export interface GrayscaleParams {
    enableThreshold: boolean; // Whether to apply thresholding
    threshold: number; // 0-255, thresholding after grayscale conversion
}
export interface GrayscaleData extends BaseProcessNodeData {
    functionName: 'grayscale';
    params: GrayscaleParams;
}

// Discriminated Union
export type ProcessNodeData = CLAHEData | GaussianBlurData | GrayscaleData;

// For backward compatibility or general usage where strict narrowing isn't immediately possible
// We can use ProcessNodeData as the main type.
export type NodeData = ProcessNodeData;

export const DEFAULT_NODE_PARAMS: Record<ProcessNodeData['functionName'], any> = {
    'createclahe': { clipLimit: 40.0, tileGridSize: [8, 8] },
    'gaussianblur': { ksize: [5, 5], sigmaX: 0, sigmaY: 0 },
    'grayscale': { enableThreshold: false, threshold: 128 },
};

// Icon mapping for each function
export const DEFAULT_NODE_ICONS: Record<ProcessNodeData['functionName'], string> = {
    'createclahe': 'histogram',
    'gaussianblur': 'brush',
    'grayscale': 'palette',
};
