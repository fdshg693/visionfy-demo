/**
 * Validators Module
 *
 * ワークフロー形式の検証と自動判別を提供
 */

import type { SimpleWorkflow, FlowSnapshot, WorkflowFormatType, ValidationResult } from '../core/types';
import { isSimpleWorkflow, isSimpleProcessNode } from './simpleWorkflowValidator';
import { isValidSnapshot, validateHistoryEntry } from './snapshotValidator';

// ====================== Re-exports ======================

export { isSimpleWorkflow, isSimpleProcessNode } from './simpleWorkflowValidator';
export { isValidSnapshot, validateHistoryEntry } from './snapshotValidator';

// ====================== Format Detection ======================

/**
 * ワークフロー形式の自動判別
 *
 * @param value - 検証対象
 * @returns 'simple' - SimpleWorkflow形式
 * @returns 'full' - FlowSnapshot形式
 * @returns 'invalid' - どちらでもない
 *
 * @example
 * ```typescript
 * const format = identifyWorkflowFormat(data);
 * switch (format) {
 *   case 'simple':
 *     return convertSimpleWorkflowToSnapshot(data);
 *   case 'full':
 *     return normalizeSnapshot(data);
 *   case 'invalid':
 *     throw new WorkflowImportError('無効な形式', 'INVALID_FORMAT');
 * }
 * ```
 */
export function identifyWorkflowFormat(value: unknown): WorkflowFormatType {
  if (isSimpleWorkflow(value)) {
    return 'simple';
  }

  if (isValidSnapshot(value)) {
    return 'full';
  }

  return 'invalid';
}

/**
 * ImportableWorkflowの型ガード
 *
 * SimpleWorkflow または FlowSnapshot のいずれかであることを検証
 *
 * @param value - 検証対象
 * @returns インポート可能な形式である場合true
 */
export function isImportableWorkflow(
  value: unknown
): value is SimpleWorkflow | FlowSnapshot {
  return isSimpleWorkflow(value) || isValidSnapshot(value);
}

/**
 * ワークフロー検証（詳細結果付き）
 *
 * @param value - 検証対象
 * @returns ValidationResult
 */
export function validateWorkflow(value: unknown): ValidationResult {
  const errors: string[] = [];

  if (!value || typeof value !== 'object') {
    errors.push('値がオブジェクトではありません');
    return {
      isValid: false,
      format: 'invalid',
      errors,
    };
  }

  const format = identifyWorkflowFormat(value);

  if (format === 'invalid') {
    errors.push('無効なワークフロー構造です');
    errors.push('簡易形式: { "processNodes": [...] }');
    errors.push('完全形式: { "nodes": [...], "edges": [...], "viewport": {...} }');
  }

  return {
    isValid: format !== 'invalid',
    format,
    errors,
  };
}
