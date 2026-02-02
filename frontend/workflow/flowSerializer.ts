// Nodeの接続データを除去してスナップショット用に整形するユーティリティ関数群

import type { Edge, Node, Viewport } from '@xyflow/react';
import type { ProcessNodeData } from '@/types/node';

export type FlowSnapshot = {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
};

const isProcessNodeData = (data: Record<string, unknown>): data is ProcessNodeData => {
  return typeof data.functionName === 'string' && data.functionName.length > 0;
};

/**
 * プロセスノードの実行時データを除去
 */
const pickProcessNodeData = (data: ProcessNodeData): ProcessNodeData => {
  const rest = { ...data } as Partial<ProcessNodeData>;
  delete rest.executionStatus;
  delete rest.result;
  delete rest.resultParams;
  delete rest.icon;
  return rest;
};

/**
 * プロセスノードではない、基本的なノードデータを抽出
 */
const pickBasicNodeData = (data: Record<string, unknown>): Record<string, unknown> => {
  if (typeof data.label === 'string') {
    return { label: data.label };
  }
  return {};
};

export const stripRuntimeNodeData = (node: Node): Node => {
  const rawData = (node.data ?? {}) as Record<string, unknown>;
  const sanitizedData = isProcessNodeData(rawData)
    ? pickProcessNodeData(rawData)
    : pickBasicNodeData(rawData);

  return {
    ...node,
    data: sanitizedData,
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
