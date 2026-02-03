/**
 * フローのシリアライゼーション
 * 役割: ノードの実行時データを除去し、永続化可能な形式に変換
 * 依存: 型ガードは @/types/typeGuards から import
 */

import type { Edge, Node, Viewport } from '@xyflow/react';
import type { ProcessNodeData } from '@/types/node';
import { isProcessNodeData } from '@/types/typeGuards';

export type FlowSnapshot = {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
};

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
 */
export const stripRuntimeNodeData = (node: Node): Node => {
  // Type-safe data extraction
  if (isProcessNodeData(node.data)) {
    return {
      ...node,
      data: pickProcessNodeData(node.data),
    };
  }

  // For non-process nodes, preserve basic data
  const basicData = pickBasicNodeData(node.data as Record<string, unknown>);
  return {
    ...node,
    data: basicData,
  };
};

/**
 * フロー全体のスナップショットを取得
 */
export const toFlowSnapshot = (
  nodes: Node[],
  edges: Edge[],
  viewport: Viewport
): FlowSnapshot => {
  return {
    nodes: nodes.map(stripRuntimeNodeData),
    edges,
    viewport,
  };
};
