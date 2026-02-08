/**
 * Execution Images Tool
 * AIが直前のワークフロー実行結果の画像（元画像・各ノードの処理前後画像）を取得するためのツール
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolContext, ToolFactory, NodeResultEntry } from './types';

/**
 * 実行画像取得ツールのファクトリー
 * 元画像と各ノードの処理前後の画像をチェイン順に返す
 */
export const createExecutionImagesTool: ToolFactory = (context) => {
  return new DynamicStructuredTool({
    name: "get_execution_images",
    description: "直前のワークフロー実行結果から、元画像（アップロード画像）と各ノードの処理前後の画像を取得します。実行結果の画像を確認・比較したい時に使用してください。",
    schema: z.object({}),
    func: async () => {
      try {
        const originalImage = context.originalImage;
        const nodeResults: NodeResultEntry[] = context.nodeResults
          ? JSON.parse(context.nodeResults)
          : [];

        if (!originalImage && nodeResults.length === 0) {
          return "実行結果がありません。ワークフローを実行してからお試しください。";
        }

        let output = "## 実行画像情報\n\n";

        // 元画像
        if (originalImage) {
          output += "### 元画像（アップロード画像）\n";
          output += `${originalImage}\n\n`;
        }

        // 各ノードの処理前後画像
        if (nodeResults.length > 0) {
          output += "### 処理チェイン\n\n";
          nodeResults.forEach((entry, index) => {
            const beforeImage = index === 0 ? originalImage : nodeResults[index - 1].result;
            output += `**${index + 1}. ${entry.functionName}**\n`;
            if (beforeImage) {
              output += `- 処理前画像: ${beforeImage}\n`;
            }
            output += `- 処理後画像: ${entry.result}\n\n`;
          });
        }

        return output;
      } catch (error) {
        return `実行画像の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
};

/**
 * このツールが有効かどうかを判定
 * 実行結果（nodeResults）が存在する場合のみ有効
 */
export const isExecutionImagesToolEnabled = (context: ToolContext) => {
  if (!context.nodeResults) return false;
  try {
    const results = JSON.parse(context.nodeResults);
    return Array.isArray(results) && results.length > 0;
  } catch {
    return false;
  }
};
