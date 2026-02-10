import { useFlowStore } from '@/workflow/flowStore';
import { stripRuntimeNodeData } from '@/workflow/workflowConverter';
import { buildNodeChain } from '@/workflow/workflowChain';
import { isProcessNodeData } from '@/types/typeGuards';
import { NODE_TYPE } from '@/constants/index';
import type { Node, Edge } from '@xyflow/react';
import type { NodeResultEntry } from '@/lib/tools/types';
import { useMemo } from 'react';

type WorkflowContext = {
  nodes: Node[];
  edges: Edge[];
  /** チェイン順に並んだ実行済みプロセスノードの結果 */
  nodeResults: NodeResultEntry[];
};

/**
 * ワークフローのコンテキスト情報を提供するフック
 * FlowStoreから取得したノード・エッジを、ランタイムデータを除去した状態で返す
 * また、実行済みノードの結果をチェイン順に抽出して返す
 */
export function useWorkflowContext(): WorkflowContext {
  const { nodes, edges } = useFlowStore();

  const strippedNodes = useMemo(() => nodes.map(stripRuntimeNodeData), [nodes]);

  const nodeResults = useMemo(() => {
    const chain = buildNodeChain(nodes, edges);
    return chain
      .filter((n) => n.type === NODE_TYPE.PROCESS)
      .filter((n) => isProcessNodeData(n.data) && n.data.result)
      .map((n) => {
        const data = n.data as { functionName: string; result: string };
        return {
          nodeId: n.id,
          functionName: data.functionName,
          result: data.result,
        };
      });
  }, [nodes, edges]);

  return useMemo(() => ({
    nodes: strippedNodes,
    edges,
    nodeResults,
  }), [strippedNodes, edges, nodeResults]);
}
