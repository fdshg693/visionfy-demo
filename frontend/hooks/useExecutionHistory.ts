/**
 * プロセスノードの実行履歴を抽出するカスタムフック
 * 役割: nodesから実行済みプロセスノードの履歴アイテム一覧を生成
 */
import { useMemo } from 'react';
import type { Node } from '@xyflow/react';
import type { ProcessNodeFunctionName, ProcessNodeParams } from '@/types/processNode';
import { isProcessNodeData } from '@/types/typeGuards';

export interface ExecutionHistoryItem {
  nodeId: string;
  functionName: ProcessNodeFunctionName;
  params: ProcessNodeParams;
  resultImage: string;
}

export function useExecutionHistory(nodes: Node[]): ExecutionHistoryItem[] {
  return useMemo(
    () =>
      nodes
        .filter((node) => node.type === 'processNode')
        .map((node) => {
          if (!isProcessNodeData(node.data)) return null;
          const data = node.data;
          if (!data.result) return null;
          return {
            nodeId: node.id,
            functionName: data.functionName,
            params: (data.resultParams ?? data.params) as ProcessNodeParams,
            resultImage: data.result,
          };
        })
        .filter((item): item is ExecutionHistoryItem => item !== null),
    [nodes]
  );
}
