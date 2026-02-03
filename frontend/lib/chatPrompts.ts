/**
 * チャットで使用するプロンプト定義
 * 機能の追加やプロンプト改修時はここで管理する
 */
import type { Node, Edge } from '@xyflow/react';
import { NODE_TYPE } from '@/constants/index';
import { buildNodeChain } from '@/workflow/workflowChain';

export const SYSTEM_PROMPT = `あなたは画像処理ワークフローアプリ「Visionfy」のAIアシスタントです。ノードベースのワークフローで画像処理を行うツールです。
以下の画像処理機能がサポートされています：
- CLAHE（コントラスト制限適応ヒストグラム均等化）
- グレイスケール変換（オプションで閾値設定可能）
- ガウシアンブラー（カーネルサイズとシグマの調整可能）
ワークフローの使い方や画像処理について質問があればお気軽にどうぞ。日本語で回答してください。
「現在のワークフロー状態」が与えられた場合はそれを踏まえて回答してください。`;

/** 各ツールの説明とパラメータの説明。新ツール追加時はここに追加する */
const TOOL_DESCRIPTIONS: Record<
  string,
  { name: string; description: string; paramDescriptions: Record<string, string> }
> = {
  createclahe: {
    name: 'CLAHE（コントラスト制限適応ヒストグラム均等化）',
    description:
      '画像のコントラストを自動的に均等化する。不均一なライティング条件を改善し、暗い領域や明るい領域の細部を強調する。',
    paramDescriptions: {
      clipLimit:
        'クリップ閾値。コントラスト強調の強さを控制する。値が大きいほど強調が強くなるが、ノイズも増える可能性がある。',
      tileGridSize: 'ヒストグラム計算用のタイルグリッドサイズ [幅, 高さ]。',
    },
  },
  gaussianblur: {
    name: 'ガウシアンブラー',
    description:
      'ガウシアン分布に基づくブラー（ぼかし）フィルタを適用する。画像のノイズ除去やエッジの滑らかにに使用される。',
    paramDescriptions: {
      ksize:
        'ブラーカーネルサイズ [幅, 高さ]。奇数値が推奨される。偶数値の場合はバックエンドで次の奇数に自動補正される。',
      sigmaX: 'X方向のガウシアン標準偏差。0の場合はksizeから自動計算される。',
      sigmaY: 'Y方向のガウシアン標準偏差。0の場合はksizeから自動計算される。',
    },
  },
  grayscale: {
    name: 'グレイスケール変換',
    description:
      'カラー画像をグレイスケール（単一チャンネル）に変換する。オプションで閾値に基づく二値化も適用可能。',
    paramDescriptions: {
      enableThreshold:
        '閾値による二値化を有効にするかどうか。falseの場合は単純なグレイスケール変換のみ。',
      threshold:
        '二値化の閾値（0-255）。この値より明るいピクセルは白（255）、暗いピクセルは黒（0）になる。',
    },
  },
};

/**
 * 現在のノード・エッジ構成からワークフローコンテキスト文字列を生成する。
 * チャットのシステムプロンプトに付与し、AIがワークフローの状態を理解できるようにする。
 */
export function buildWorkflowContext(nodes: Node[], edges: Edge[]): string {
  const chain = buildNodeChain(nodes, edges);
  const chainedIds = new Set(chain.map((n) => n.id));

  // パイプライン表記のラベル列
  const pipelineLabels = chain.map((node) => {
    if (node.type === NODE_TYPE.START) return 'Start';
    if (node.type === NODE_TYPE.END) return 'End';
    const data = node.data as Record<string, unknown>;
    const fnName = data?.functionName as string | undefined;
    return TOOL_DESCRIPTIONS[fnName ?? '']?.name ?? fnName ?? 'Unknown';
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
      const toolInfo = fnName ? TOOL_DESCRIPTIONS[fnName] : undefined;
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
      context += `- ${TOOL_DESCRIPTIONS[fnName ?? '']?.name ?? fnName ?? 'Unknown'}\n`;
    });
  }

  return context;
}
