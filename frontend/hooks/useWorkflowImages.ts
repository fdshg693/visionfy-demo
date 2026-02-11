/**
 * ワークフロー画像一覧を取得するカスタムフック
 * 役割: 元画像と実行履歴から画像一覧を生成
 */
import { useMemo, useState, useEffect } from 'react';
import { useInspector } from '@/contexts/InspectorContext';
import { useFlowStore } from '@/workflow/flowStore';
import { useExecutionHistory } from './useExecutionHistory';
import { isProcessNodeData } from '@/types/typeGuards';

export interface WorkflowImage {
  id: string;           // "original" または nodeId
  label: string;        // "{画像0}" 〜 "{画像N}"
  description: string;  // "元画像" または ノードのラベル
  base64: string;       // base64画像データ（data:image/...;base64, プレフィックス付き）
  mimeType: string;     // "image/jpeg" など
}

/**
 * data URLからmimeTypeを抽出
 * @param dataUrl - data:image/jpeg;base64,... 形式の文字列
 * @returns mimeType (例: "image/jpeg")
 */
function extractMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match ? match[1] : 'image/jpeg';
}

/**
 * FileをBase64に変換（data: プレフィックス付き）
 * @param file - 変換対象のファイル
 * @returns data URL形式のbase64文字列
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * ワークフロー画像一覧フック
 * 元画像と実行済みノードの結果画像を統合して配列で返す
 */
export function useWorkflowImages(): WorkflowImage[] {
  const { files } = useInspector();
  const { nodes } = useFlowStore();
  const executionHistory = useExecutionHistory(nodes);

  const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);

  // 元画像をBase64に変換
  useEffect(() => {
    const file = files[0]?.file;
    if (!file) {
      setOriginalImageBase64(null);
      return;
    }

    fileToBase64(file)
      .then(setOriginalImageBase64)
      .catch((error) => {
        console.error('Failed to convert file to base64:', error);
        setOriginalImageBase64(null);
      });
  }, [files]);

  // 画像一覧を構築
  return useMemo(() => {
    const images: WorkflowImage[] = [];

    // 元画像を追加
    if (originalImageBase64) {
      images.push({
        id: 'original',
        label: '{画像0}',
        description: '元画像',
        base64: originalImageBase64,
        mimeType: extractMimeType(originalImageBase64),
      });
    }

    // 実行履歴を追加
    executionHistory.forEach((item, index) => {
      // ノードのラベルを取得
      const node = nodes.find((n) => n.id === item.nodeId);
      const description = node?.data && isProcessNodeData(node.data)
        ? node.data.label
        : item.functionName;

      images.push({
        id: item.nodeId,
        label: `{画像${index + 1}}`,
        description,
        base64: item.resultImage,
        mimeType: extractMimeType(item.resultImage),
      });
    });

    return images;
  }, [originalImageBase64, executionHistory, nodes]);
}
