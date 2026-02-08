import { useFlowStore } from '@/workflow/flowStore';
import { stripRuntimeNodeData } from '@/workflow/flowSerializer';
import type { Node, Edge } from '@xyflow/react';
import { useMemo } from 'react';

type WorkflowContext = {
  nodes: Node[];
  edges: Edge[];
};

/**
 * ワークフローのコンテキスト情報を提供するフック
 * FlowStoreから取得したノード・エッジを、ランタイムデータを除去した状態で返す
 * ChatPanelなど、ワークフロー構造のみを参照するコンポーネント向け
 */
export function useWorkflowContext(): WorkflowContext {
  const { nodes, edges } = useFlowStore();

  return useMemo(() => ({
    nodes: nodes.map(stripRuntimeNodeData),
    edges,
  }), [nodes, edges]);
}
