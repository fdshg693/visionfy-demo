/**
 * Workflow Context Tool
 * AIがワークフローの現在の状態を取得するためのツール
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { Node, Edge } from '@xyflow/react';
import { buildWorkflowContext } from '../chatPrompts';
import type { ToolFactory } from './types';

/**
 * ワークフローコンテキスト取得ツールのファクトリー
 * ノードとエッジ情報からワークフロー状態の説明を生成する
 */
export const createWorkflowContextTool: ToolFactory = (context) => {
  return new DynamicStructuredTool({
    name: "get_workflow_context",
    description: "現在のワークフロー構成と各ノードの設定を取得します。ユーザーのワークフロー状態を確認したい時に使用してください。",
    schema: z.object({
      // 引数は不要だが、zod schemaは必須なので空オブジェクトを定義
    }),
    func: async () => {
      try {
        // コンテキストからノードとエッジを復元
        const nodes: Node[] = context.nodes ? JSON.parse(context.nodes) : [];
        const edges: Edge[] = context.edges ? JSON.parse(context.edges) : [];
        
        // buildWorkflowContextを使用して状態文字列を生成
        const workflowState = buildWorkflowContext(nodes, edges);
        
        return workflowState;
      } catch (error) {
        return `ワークフローコンテキストの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
};

/**
 * このツールが有効かどうかを判定
 * ノードとエッジの情報が存在する場合のみ有効
 */
export const isWorkflowContextToolEnabled = (context: { nodes?: string; edges?: string }) => {
  return !!(context.nodes && context.edges);
};
