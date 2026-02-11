/**
 * FlowSnapshot形式の検証
 *
 * 完全なワークフロースナップショット形式の構造検証を提供
 */

import type { FlowSnapshot, FlowHistoryEntry } from '../core/types';

/**
 * FlowSnapshotの型ガード
 *
 * 浅いバリデーション：構造チェックのみ
 * - nodes配列の存在
 * - edges配列の存在
 * - viewportオブジェクトの存在
 *
 * ノードデータの深い検証は行わない（React Flowに委譲）
 *
 * @param value - 検証対象
 * @returns FlowSnapshotである場合true
 *
 * @example
 * ```typescript
 * const data = JSON.parse(jsonString);
 * if (isValidSnapshot(data)) {
 *   // dataはFlowSnapshot型
 *   setNodes(data.nodes);
 *   setEdges(data.edges);
 *   setViewport(data.viewport);
 * }
 * ```
 */
export function isValidSnapshot(value: unknown): value is FlowSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const snapshot = value as FlowSnapshot;

  return (
    Array.isArray(snapshot.nodes) &&
    Array.isArray(snapshot.edges) &&
    typeof snapshot.viewport === 'object' &&
    snapshot.viewport !== null
  );
}

/**
 * FlowHistoryEntryの検証
 *
 * 履歴エントリの構造検証：
 * - id文字列の存在
 * - createdAt文字列の存在
 * - name文字列の存在（省略可、後でデフォルト値補完）
 * - snapshotの有効性
 *
 * @param entry - 検証対象
 * @returns FlowHistoryEntryである場合true
 */
export function validateHistoryEntry(entry: unknown): entry is FlowHistoryEntry {
  if (!entry || typeof entry !== 'object') {
    return false;
  }

  const e = entry as Partial<FlowHistoryEntry>;

  return (
    typeof e.id === 'string' &&
    typeof e.createdAt === 'string' &&
    isValidSnapshot(e.snapshot)
  );
}
