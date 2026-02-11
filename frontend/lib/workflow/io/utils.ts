/**
 * I/O Utilities
 *
 * インポート・エクスポートで使用されるユーティリティ関数
 */

import type { Node } from '@xyflow/react';
import type { ProcessNodeData } from '@/types/processNode';
import { isProcessNodeData } from '@/types/typeGuards';
import type { FlowSnapshot } from '../core/types';

// ====================== Runtime Data Stripping ======================

/**
 * プロセスノードから永続化する項目を明示的に抽出
 */
const pickProcessNodeData = (data: ProcessNodeData) => ({
  label: data.label,
  functionName: data.functionName,
  params: data.params,
});

/**
 * プロセスノードではない、基本的なノードデータを抽出
 */
const pickBasicNodeData = (data: Record<string, unknown>): Record<string, unknown> => {
  if (typeof data.label === 'string') {
    return { label: data.label };
  }
  return {};
};

/**
 * ノードから実行時データを除去し、永続化可能なノードを返す
 *
 * 除去されるフィールド:
 * - executionStatus (IDLE/RUNNING/SUCCESS/ERROR)
 * - result (base64 image)
 * - resultParams (実行時パラメータ)
 * - icon (UIデコレーション)
 *
 * @param node - React Flowノード
 * @returns ランタイムデータを除去したノード
 */
export function stripRuntimeNodeData(node: Node): Node {
  if (isProcessNodeData(node.data)) {
    return {
      ...node,
      data: pickProcessNodeData(node.data),
    };
  }

  const basicData = pickBasicNodeData(node.data as Record<string, unknown>);
  return {
    ...node,
    data: basicData,
  };
}

// ====================== Backward Compatibility ======================

/**
 * 後方互換のためのスナップショット正規化
 *
 * 旧形式: type: 'custom' → 新形式: type: 'processNode'
 *
 * @param snapshot - FlowSnapshot
 * @returns 正規化されたFlowSnapshot
 */
export function normalizeSnapshot(snapshot: FlowSnapshot): FlowSnapshot {
  return {
    ...snapshot,
    nodes: snapshot.nodes.map((node) =>
      node.type === 'custom' ? { ...node, type: 'processNode' } : node
    ),
  };
}
