import type { Connection, Edge } from '@xyflow/react';

/**
 * 接続時の制約チェック
 * 1つのノードからの出力は1つまで、1つのノードへの入力は1つまで
 */
export const getConnectionConstraintError = (
  params: Connection,
  edges: Edge[]
): string | null => {
  if (!params.source || !params.target) {
    return '接続先が無効です。';
  }

  const sourceEdges = edges.filter((edge) => edge.source === params.source);
  if (sourceEdges.length >= 1) {
    return '制約エラー: 1つのノードからの出力は1つまでです。';
  }

  const targetEdges = edges.filter((edge) => edge.target === params.target);
  if (targetEdges.length >= 1) {
    return '制約エラー: 1つのノードへの入力は1つまでです。';
  }

  return null;
};
