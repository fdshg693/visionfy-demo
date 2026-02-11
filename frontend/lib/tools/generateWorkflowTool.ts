/**
 * Generate Workflow Tool
 * AIがワークフローを生成してキャンバスに適用するためのツール
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PROCESS_FUNCTIONS_BASE } from '@/types/processFunctionBase';
import { WorkflowAIAdapter } from '@/lib/workflow';
import type { SimpleWorkflow } from '@/lib/workflow';
import type { ToolFactory } from './types';

/**
 * ワークフロー生成ツールのファクトリー
 */
export const createGenerateWorkflowTool: ToolFactory = () => {
  const validFunctionNames = Object.keys(PROCESS_FUNCTIONS_BASE);

  return new DynamicStructuredTool({
    name: "generate_workflow",
    description:
      "ワークフローを生成してキャンバスに適用します。processNodesに処理ノードを順番に定義してください。params省略時はデフォルト値が使用されます。利用可能な関数名: createclahe, gaussianblur, grayscale, remove_noise, restore_brightness, restore_contrast, model_inference",
    schema: z.object({
      processNodes: z.array(
        z.object({
          functionName: z
            .string()
            .describe(
              "処理関数名（例: createclahe, gaussianblur, grayscale, remove_noise, restore_brightness, restore_contrast, model_inference）"
            ),
          params: z
            .any()
            .optional()
            .describe(
              "処理パラメータのオブジェクト（省略時はデフォルト値が使用されます）。例: {clipLimit: 2.0, tileGridSize: [8, 8]}"
            ),
        })
      ),
    }),
    func: async (input) => {
      try {
        console.log('[generateWorkflowTool] Called with input:', JSON.stringify(input, null, 2));

        // バリデーション
        for (const node of input.processNodes) {
          if (!validFunctionNames.includes(node.functionName)) {
            return `エラー: 不明な関数名「${node.functionName}」です。利用可能な関数名: ${validFunctionNames.join(', ')}`;
          }
        }

        console.log('[generateWorkflowTool] Validation passed');

        // WorkflowAIAdapterを使用してセッション登録
        const simpleWorkflow = input as SimpleWorkflow;
        const sessionId = crypto.randomUUID();
        await WorkflowAIAdapter.registerSession(simpleWorkflow, sessionId);

        const successMessage = `ワークフローを生成しました。キャンバスに適用します。[WORKFLOW_SESSION:${sessionId}]`;
        console.log('[generateWorkflowTool] Returning success message:', successMessage);
        return successMessage;
      } catch (error) {
        console.error('[generateWorkflowTool] Error:', error);
        return `ワークフロー生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
};

/**
 * このツールは常に有効
 */
export const isGenerateWorkflowToolEnabled = () => true;
