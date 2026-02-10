/**
 * Generate Workflow Tool
 * AIがワークフローを生成してキャンバスに適用するためのツール
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { PROCESS_FUNCTIONS_BASE } from '@/types/processFunctionBase';
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
            .record(
              z.string(),
              z.union([
                z.number(),
                z.string(),
                z.boolean(),
                z.array(z.number()),
              ])
            )
            .optional()
            .describe(
              "処理パラメータ（省略時はデフォルト値が使用されます）"
            ),
        })
      ),
    }),
    func: async (input) => {
      try {
        for (const node of input.processNodes) {
          if (!validFunctionNames.includes(node.functionName)) {
            return `エラー: 不明な関数名「${node.functionName}」です。利用可能な関数名: ${validFunctionNames.join(', ')}`;
          }
        }
        return `WORKFLOW_JSON:${JSON.stringify(input)}`;
      } catch (error) {
        return `ワークフロー生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
};

/**
 * このツールは常に有効
 */
export const isGenerateWorkflowToolEnabled = () => true;
