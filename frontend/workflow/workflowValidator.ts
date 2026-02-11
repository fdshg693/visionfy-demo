/**
 * ワークフロー検証ロジック集約
 *
 * このモジュールは以下の検証機能を提供：
 * 1. SimpleWorkflow形式の検証
 * 2. FlowSnapshot形式の検証
 * 3. FlowHistoryEntry形式の検証
 * 4. ワークフロー形式の自動判別
 */

import type { FlowSnapshot, FlowHistoryEntry } from '@/types/workflowPersistence';
import { isSimpleWorkflow, type SimpleWorkflow } from '@/types/simpleWorkflow';

// Re-export for convenience
export { isSimpleWorkflow };

/**
 * FlowSnapshotの型ガード
 *
 * 浅いバリデーション：構造チェックのみ
 * - nodes配列の存在
 * - edges配列の存在
 * - viewportオブジェクトの存在
 *
 * ノードデータの深い検証は行わない
 */
export const isValidSnapshot = (value: unknown): value is FlowSnapshot => {
  if (!value || typeof value !== 'object') return false;

  const snapshot = value as FlowSnapshot;

  return (
    Array.isArray(snapshot.nodes) &&
    Array.isArray(snapshot.edges) &&
    typeof snapshot.viewport === 'object' &&
    snapshot.viewport !== null
  );
};

/**
 * FlowHistoryEntryの型ガード
 *
 * 履歴エントリの構造検証：
 * - id文字列の存在
 * - createdAt文字列の存在
 * - name文字列の存在（省略可、後でデフォルト値補完）
 * - snapshotの有効性
 */
export const validateHistoryEntry = (entry: unknown): entry is FlowHistoryEntry => {
  if (!entry || typeof entry !== 'object') return false;

  const e = entry as Partial<FlowHistoryEntry>;

  return (
    typeof e.id === 'string' &&
    typeof e.createdAt === 'string' &&
    isValidSnapshot(e.snapshot)
  );
};

/**
 * ワークフロー形式の自動判別
 *
 * @returns 'simple' - SimpleWorkflow形式
 * @returns 'full' - FlowSnapshot形式
 * @returns 'invalid' - どちらでもない
 *
 * @example
 * const format = identifyWorkflowFormat(json);
 * if (format === 'simple') {
 *   const snapshot = convertSimpleWorkflowToSnapshot(json);
 * } else if (format === 'full') {
 *   const snapshot = normalizeSnapshot(json);
 * }
 */
export const identifyWorkflowFormat = (
  value: unknown
): 'simple' | 'full' | 'invalid' => {
  if (isSimpleWorkflow(value)) {
    return 'simple';
  }

  if (isValidSnapshot(value)) {
    return 'full';
  }

  return 'invalid';
};

/**
 * ImportableWorkflowの型ガード
 *
 * SimpleWorkflow または FlowSnapshot のいずれかであることを検証
 */
export const isImportableWorkflow = (
  value: unknown
): value is SimpleWorkflow | FlowSnapshot => {
  return isSimpleWorkflow(value) || isValidSnapshot(value);
};
