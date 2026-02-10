/**
 * Get Image Tool
 * AIがワークフローの画像を取得するためのツール
 * セッションベースの予約パターンで画像データを受け渡す
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolFactory, ToolContext, NodeResultEntry } from './types';
import { NODE_DESCRIPTIONS } from './availableNodesTool';
import type { ProcessNodeFunctionName } from '@/types/processNode';

/** ツールが参照する画像エントリ */
interface ImageEntry {
  index: number;
  description: string;
  base64: string;
  mimeType: string;
}

/**
 * data URLからmimeTypeを抽出
 */
function extractMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/jpeg';
}

/**
 * ToolContextから画像リストを構築
 */
function buildImageList(context: ToolContext): ImageEntry[] {
  const images: ImageEntry[] = [];

  if (context.originalImage) {
    images.push({
      index: 0,
      description: '元画像',
      base64: context.originalImage,
      mimeType: extractMimeType(context.originalImage),
    });
  }

  if (context.nodeResults) {
    const nodeResults: NodeResultEntry[] = JSON.parse(context.nodeResults);
    for (const result of nodeResults) {
      const fnName = result.functionName as ProcessNodeFunctionName;
      const displayName = (fnName in NODE_DESCRIPTIONS)
        ? NODE_DESCRIPTIONS[fnName].name
        : result.functionName;
      images.push({
        index: images.length,
        description: `${displayName}の処理結果`,
        base64: result.result,
        mimeType: extractMimeType(result.result),
      });
    }
  }

  return images;
}

/**
 * 画像取得ツールのファクトリー
 */
export const createGetImageTool: ToolFactory = (context) => {
  return new DynamicStructuredTool({
    name: "get_image",
    description:
      "ワークフローの画像を取得して確認します。imageIndexで取得する画像の番号（0始まり）を指定してください。利用可能な画像はシステムプロンプトに記載されています。",
    schema: z.object({
      imageIndex: z
        .number()
        .describe("取得する画像の番号（0始まり）。利用可能な画像番号はシステムプロンプトを参照してください。"),
    }),
    func: async (input) => {
      try {
        const images = buildImageList(context);

        if (images.length === 0) {
          return 'エラー: 利用可能な画像がありません。ワークフローに画像をアップロードするか、ワークフローを実行してください。';
        }

        if (input.imageIndex < 0 || input.imageIndex >= images.length) {
          return `エラー: 画像番号${input.imageIndex}は存在しません。利用可能な画像番号: 0〜${images.length - 1}`;
        }

        const selectedImage = images[input.imageIndex];

        // セッションIDを生成して画像データを内部APIに保存
        const sessionId = crypto.randomUUID();
        const port = process.env.PORT || 3000;
        const response = await fetch(`http://localhost:${port}/api/image-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: {
              description: selectedImage.description,
              base64: selectedImage.base64,
              mimeType: selectedImage.mimeType,
            },
            sessionId,
          }),
        });

        if (!response.ok) {
          return '画像データの保存に失敗しました。';
        }

        return `画像を取得しました。「${selectedImage.description}」を確認します。[IMAGE_SESSION:${sessionId}]`;
      } catch (error) {
        return `画像取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
};

/**
 * このツールが有効かどうかを判定
 * 元画像またはノード実行結果が存在する場合のみ有効
 */
export const isGetImageToolEnabled = (context: ToolContext) => {
  return !!(context.originalImage || context.nodeResults);
};
