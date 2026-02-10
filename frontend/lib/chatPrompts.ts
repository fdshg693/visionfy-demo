/**
 * チャットで使用するシステムプロンプト定義
 */

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
ツール使用前にget_available_nodesで利用可能なノードとパラメータを確認すると正確なワークフロー生成が可能です。

画像の内容を確認したい場合は、get_imageツールを使用してください。取得した画像は次のターンでユーザーメッセージとして渡されます。`;

/**
 * ワークフロー画像の動的コンテキストを生成する
 * システムプロンプトに付加して、AIが利用可能な画像を認識できるようにする
 * @param originalImage 元画像のbase64データURL（存在する場合）
 * @param nodeResults 実行済みノードの結果配列
 * @returns 画像コンテキスト文字列（画像がない場合は空文字列）
 */
export function buildImageContext(
  originalImage?: string,
  nodeResults?: { functionName: string }[],
): string {
  const imageDescriptions: string[] = [];

  if (originalImage) {
    imageDescriptions.push('画像0: 元画像');
  }

  if (nodeResults) {
    for (const result of nodeResults) {
      const fnName = result.functionName as ProcessNodeFunctionName;
      const displayName = (fnName in NODE_DESCRIPTIONS)
        ? NODE_DESCRIPTIONS[fnName].name
        : result.functionName;
      const imageIndex = imageDescriptions.length;
      imageDescriptions.push(`画像${imageIndex}: ${displayName}の処理結果`);
    }
  }

  if (imageDescriptions.length === 0) return '';

  return `\n\n## 利用可能なワークフロー画像\n以下の画像がワークフローにあります。get_imageツールで画像番号を指定して取得・確認できます。\n${imageDescriptions.map(d => `- ${d}`).join('\n')}`;
}
