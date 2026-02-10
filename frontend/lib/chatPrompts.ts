/**
 * チャットで使用するプロンプト定義
 * 機能の追加やプロンプト改修時はここで管理する
 */
import type { Node, Edge } from '@xyflow/react';
import { NODE_TYPE } from '@/constants/index';
import { buildNodeChain } from '@/workflow/workflowChain';
import { NODE_DESCRIPTIONS } from '@/lib/tools/availableNodesTool';
import type { ProcessNodeFunctionName } from '@/types/processNode';

export const SYSTEM_PROMPT = `あなたは画像処理ワークフローアプリ「Visionfy」のAIアシスタントです。ノードベースのワークフローで画像処理を行うツールです。
以下の画像処理機能がサポートされています：
- CLAHE（コントラスト制限適応ヒストグラム均等化）
- グレイスケール変換（オプションで閾値設定可能）
- ガウシアンブラー（カーネルサイズとシグマの調整可能）
- ノイズ除去（メディアンブラー）
- 明るさ復元
- コントラスト復元（ガンマ補正）
- モデル推論（Patchcore異常検知）
ワークフローの使い方や画像処理について質問があればお気軽にどうぞ。日本語で回答してください。
「現在のワークフロー状態」が与えられた場合はそれを踏まえて回答してください。

ユーザーからワークフローの構築や画像処理パイプラインの作成を依頼された場合は、generate_workflowツールを使用してキャンバスにワークフローを直接生成してください。
ツール使用前にget_available_nodesで利用可能なノードとパラメータを確認すると正確なワークフロー生成が可能です。`;

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
