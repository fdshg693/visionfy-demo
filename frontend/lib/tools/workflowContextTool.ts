/**
 * Workflow Context Tool
 * AIがワークフローの現在の状態を取得するためのツール
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { Node, Edge } from '@xyflow/react';
import type { ToolFactory } from './types';
import { NODE_TYPE } from '@/constants/index';
import { buildNodeChain } from '@/workflow/workflowChain';
import { NODE_DESCRIPTIONS } from '@/lib/tools/availableNodesTool';
import type { ProcessNodeFunctionName } from '@/types/processNode';

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

/**
 * 現在のノード・エッジ構成からワークフローコンテキスト文字列を生成する。
 * チャットのシステムプロンプトに付与し、AIがワークフローの状態を理解できるようにする。
 */
function buildWorkflowContext(nodes: Node[], edges: Edge[]): string {
  const chain = buildNodeChain(nodes, edges);
  const chainedIds = new Set(chain.map((n) => n.id));

  // パイプライン表記のラベル列
  const pipelineLabels = chain.map((node) => {
    if (node.type === NODE_TYPE.START) return 'Start';
    if (node.type === NODE_TYPE.END) return 'End';
    const data = node.data as Record<string, unknown>;
    const fnName = data?.functionName as string | undefined;
    return (fnName && fnName in NODE_DESCRIPTIONS)
      ? NODE_DESCRIPTIONS[fnName as ProcessNodeFunctionName].name
      : (fnName ?? 'Unknown');
  });

  let context = '## 現在のワークフロー状態\n\n';

  // パイプライン構成
  context += '### パイプライン構成\n';
  context +=
    pipelineLabels.length > 0
      ? pipelineLabels.join(' → ')
      : '接続されたパイプラインはありません';
  context += '\n\n';

  // チェインに含まれるプロセスノードの詳細
  const processNodesInChain = chain.filter((n) => n.type === NODE_TYPE.PROCESS);
  if (processNodesInChain.length > 0) {
    context += '### 各ツールの設定と説明\n';
    processNodesInChain.forEach((node, i) => {
      const data = node.data as Record<string, unknown>;
      const fnName = data?.functionName as string | undefined;
      const toolInfo = (fnName && fnName in NODE_DESCRIPTIONS)
        ? NODE_DESCRIPTIONS[fnName as ProcessNodeFunctionName]
        : undefined;
      if (!toolInfo || !fnName) return;

      context += `\n**${i + 1}. ${toolInfo.name}**\n`;
      context += `- 説明: ${toolInfo.description}\n`;
      context += '- 現在のパラメータ:\n';

      const params = data?.params as Record<string, unknown> | undefined;
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          const valueStr = Array.isArray(value) ? `[${value.join(', ')}]` : String(value);
          const paramDesc = toolInfo.paramDescriptions[key];
          context += `  - ${key}: ${valueStr}${paramDesc ? ` — ${paramDesc}` : ''}\n`;
        }
      }
    });
    context += '\n';
  }

  // 未接続のプロセスノード
  const disconnected = nodes.filter(
    (n) => n.type === NODE_TYPE.PROCESS && !chainedIds.has(n.id)
  );
  if (disconnected.length > 0) {
    context += '### 未接続のノード\n以下のノードはパイプラインに接続されていません:\n';
    disconnected.forEach((node) => {
      const data = node.data as Record<string, unknown>;
      const fnName = data?.functionName as string | undefined;
      const name = (fnName && fnName in NODE_DESCRIPTIONS)
        ? NODE_DESCRIPTIONS[fnName as ProcessNodeFunctionName].name
        : (fnName ?? 'Unknown');
      context += `- ${name}\n`;
    });
  }

  return context;
}
