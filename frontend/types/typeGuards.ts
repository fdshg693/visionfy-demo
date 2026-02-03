/**
 * Type guard functions for runtime type checking
 * These functions provide type-safe alternatives to dangerous type assertions
 */

import type { Node } from '@xyflow/react';
import { NODE_TYPE } from '@/constants/index';
import type {
  ProcessNodeData,
  CLAHEData,
  GaussianBlurData,
  GrayscaleData,
  BaseProcessNodeData,
} from './node';

/**
 * Checks if the given data is BaseProcessNodeData
 */
export function isBaseProcessNodeData(data: unknown): data is BaseProcessNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'label' in data &&
    typeof (data as BaseProcessNodeData).label === 'string'
  );
}

/**
 * Checks if the given data is ProcessNodeData (any process node variant)
 */
export function isProcessNodeData(data: unknown): data is ProcessNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'functionName' in data &&
    typeof (data as ProcessNodeData).functionName === 'string' &&
    ['createclahe', 'gaussianblur', 'grayscale'].includes(
      (data as ProcessNodeData).functionName
    )
  );
}

/**
 * Checks if the given data is CLAHEData
 */
export function isCLAHEData(data: unknown): data is CLAHEData {
  return (
    isProcessNodeData(data) &&
    data.functionName === 'createclahe' &&
    'params' in data &&
    typeof data.params === 'object' &&
    data.params !== null &&
    'clipLimit' in data.params &&
    'tileGridSize' in data.params
  );
}

/**
 * Checks if the given data is GaussianBlurData
 */
export function isGaussianBlurData(data: unknown): data is GaussianBlurData {
  return (
    isProcessNodeData(data) &&
    data.functionName === 'gaussianblur' &&
    'params' in data &&
    typeof data.params === 'object' &&
    data.params !== null &&
    'ksize' in data.params &&
    'sigmaX' in data.params &&
    'sigmaY' in data.params
  );
}

/**
 * Checks if the given data is GrayscaleData
 */
export function isGrayscaleData(data: unknown): data is GrayscaleData {
  return (
    isProcessNodeData(data) &&
    data.functionName === 'grayscale' &&
    'params' in data &&
    typeof data.params === 'object' &&
    data.params !== null &&
    'enableThreshold' in data.params &&
    'threshold' in data.params
  );
}

/**
 * Checks if the given node is a process node with ProcessNodeData
 */
export function isProcessNode(node: Node): node is Node<ProcessNodeData> {
  return node.type === NODE_TYPE.PROCESS && isProcessNodeData(node.data);
}

/**
 * Safely extracts ProcessNodeData from a node, throwing an error if invalid
 */
export function assertProcessNodeData(data: unknown): ProcessNodeData {
  if (!isProcessNodeData(data)) {
    throw new Error('Invalid ProcessNodeData structure');
  }
  return data;
}

/**
 * Safely extracts BaseProcessNodeData from a node, throwing an error if invalid
 */
export function assertBaseProcessNodeData(data: unknown): BaseProcessNodeData {
  if (!isBaseProcessNodeData(data)) {
    throw new Error('Invalid BaseProcessNodeData structure');
  }
  return data;
}
