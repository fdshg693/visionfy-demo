export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

// Base interface for all process nodes
export interface BaseProcessNodeData extends Record<string, unknown> {
    label: string;
    executionStatus?: ExecutionStatus;
}

// 1. CLAHE (Adaptive Histogram Equalization)
export interface CLAHEParams {
    clipLimit: number;
    tileGridSize: [number, number];
}
export interface CLAHEData extends BaseProcessNodeData {
    functionName: 'cv2.createCLAHE';
    params: CLAHEParams;
}

// 2. GaussianBlur
export interface GaussianBlurParams {
    ksize: [number, number]; // Must be odd
    sigmaX: number;
    sigmaY: number;
}
export interface GaussianBlurData extends BaseProcessNodeData {
    functionName: 'cv2.GaussianBlur';
    params: GaussianBlurParams;
}

// 3. Color Conversion (RGB2GRAY)
export interface CvtColorParams {
    code: number; // Fixed to 7 (cv2.COLOR_RGB2GRAY)
}
export interface CvtColorData extends BaseProcessNodeData {
    functionName: 'cv2.cvtColor';
    params: CvtColorParams;
}

// Discriminated Union
export type ProcessNodeData = CLAHEData | GaussianBlurData | CvtColorData;

// For backward compatibility or general usage where strict narrowing isn't immediately possible
// We can use ProcessNodeData as the main type.
export type NodeData = ProcessNodeData;

export const DEFAULT_NODE_PARAMS: Record<ProcessNodeData['functionName'], any> = {
    'cv2.createCLAHE': { clipLimit: 40.0, tileGridSize: [8, 8] },
    'cv2.GaussianBlur': { ksize: [5, 5], sigmaX: 0, sigmaY: 0 },
    'cv2.cvtColor': { code: 7 }
};

