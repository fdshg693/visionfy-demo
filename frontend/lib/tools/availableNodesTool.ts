/**
 * Available Nodes Tool
 * AIが利用可能な処理ノードの一覧を取得するためのツール
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { DEFAULT_NODE_PARAMS, DEFAULT_NODE_ICONS } from '@/types/node';
import type { ProcessNodeFunctionName } from '@/types/node';
import type { ToolFactory } from './types';

/**
 * 各ノードタイプの詳細情報
 * chatPrompts.tsのTOOL_DESCRIPTIONSは非公開かつ不完全なので、ここで全6種を定義
 */
const NODE_DESCRIPTIONS: Record<ProcessNodeFunctionName, {
  name: string;
  description: string;
  paramDescriptions: Record<string, string>;
}> = {
  createclahe: {
    name: 'CLAHE（コントラスト制限適応ヒストグラム均等化）',
    description: '画像のコントラストを自動的に均等化する処理です。局所的なコントラストを改善し、暗い部分や明るい部分の詳細を引き出します。',
    paramDescriptions: {
      clipLimit: 'コントラスト制限のしきい値（デフォルト: 40.0）。値が大きいほどコントラストが強くなります。',
      tileGridSize: 'タイルグリッドのサイズ [幅, 高さ]（デフォルト: [8, 8]）。画像を分割するグリッドの大きさを指定します。',
    },
  },
  gaussianblur: {
    name: 'ガウシアンブラー',
    description: 'ガウシアン分布に基づくブラー（ぼかし）処理です。ノイズ除去や画像の平滑化に使用します。',
    paramDescriptions: {
      ksize: 'カーネルサイズ [幅, 高さ]（デフォルト: [5, 5]）。奇数である必要があります。値が大きいほどぼかしが強くなります。',
      sigmaX: 'X方向の標準偏差（デフォルト: 0）。0の場合はカーネルサイズから自動計算されます。',
      sigmaY: 'Y方向の標準偏差（デフォルト: 0）。0の場合はsigmaXと同じ値が使用されます。',
    },
  },
  grayscale: {
    name: 'グレイスケール変換',
    description: 'カラー画像をグレイスケール（白黒）に変換します。オプションで二値化しきい値を適用できます。',
    paramDescriptions: {
      enableThreshold: '二値化しきい値を有効にするかどうか（デフォルト: false）。',
      threshold: '二値化のしきい値 0-255（デフォルト: 128）。enableThresholdがtrueの場合に使用されます。',
    },
  },
  remove_noise: {
    name: 'ノイズ除去（メディアンブラー）',
    description: 'メディアンフィルタを使用して画像のノイズを除去します。特にソルト＆ペッパーノイズに効果的です。',
    paramDescriptions: {},
  },
  restore_brightness: {
    name: '明るさ復元',
    description: '画像の明るさを調整します。暗すぎる画像や明るすぎる画像を補正できます。',
    paramDescriptions: {
      value: '明るさの調整値（デフォルト: -30）。正の値で明るく、負の値で暗くなります。',
    },
  },
  restore_contrast: {
    name: 'コントラスト復元（ガンマ補正）',
    description: 'ガンマ補正を使用してコントラストを調整します。画像の明暗バランスを改善できます。',
    paramDescriptions: {
      gamma: 'ガンマ値（デフォルト: 1.7）。1.0未満で暗くなり、1.0より大きいと明るくなります。',
    },
  },
};

/**
 * 利用可能なノード情報をフォーマットされた文字列として生成
 */
function buildAvailableNodesInfo(): string {
  const lines: string[] = ['利用可能な処理ノード一覧:', ''];

  const functionNames = Object.keys(NODE_DESCRIPTIONS) as ProcessNodeFunctionName[];

  for (const funcName of functionNames) {
    const info = NODE_DESCRIPTIONS[funcName];
    const icon = DEFAULT_NODE_ICONS[funcName];
    const defaultParams = DEFAULT_NODE_PARAMS[funcName];

    lines.push(`## ${info.name}`);
    lines.push(`- 関数名: ${funcName}`);
    lines.push(`- アイコン: ${icon}`);
    lines.push(`- 説明: ${info.description}`);

    const paramKeys = Object.keys(info.paramDescriptions);
    if (paramKeys.length > 0) {
      lines.push('- パラメータ:');
      for (const paramKey of paramKeys) {
        const defaultValue = (defaultParams as Record<string, unknown>)[paramKey];
        const defaultStr = defaultValue !== undefined ? JSON.stringify(defaultValue) : '(なし)';
        lines.push(`  - ${paramKey}: ${info.paramDescriptions[paramKey]} [デフォルト値: ${defaultStr}]`);
      }
    } else {
      lines.push('- パラメータ: なし');
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 利用可能ノード一覧取得ツールのファクトリー
 */
export const createAvailableNodesTool: ToolFactory = () => {
  return new DynamicStructuredTool({
    name: "get_available_nodes",
    description: "利用可能な処理ノードの一覧とそのパラメータ情報を取得します。どのような画像処理が使えるか確認したい時に使用してください。",
    schema: z.object({}),
    func: async () => {
      try {
        return buildAvailableNodesInfo();
      } catch (error) {
        return `利用可能ノード情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
};

/**
 * このツールは常に有効
 */
export const isAvailableNodesToolEnabled = () => true;
