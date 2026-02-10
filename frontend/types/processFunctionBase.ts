/**
 * Process Function Base Definitions
 * 全処理ノードの統合定義 - Single Source of Truth
 *
 * この定義から以下が自動生成される：
 * - processFunction.ts の VISIONFY_FUNCTIONS_CONFIG (UI用)
 * - availableNodesTool.ts の NODE_DESCRIPTIONS (AI用)
 * - processNode.ts の DEFAULT_NODE_PARAMS (デフォルト値)
 * - processNode.ts の DEFAULT_NODE_ICONS (アイコン)
 */

import type { ProcessNodeFunctionName } from './processNode';

export type OpencvParamValue = number | string | boolean | [number, number];

/**
 * パラメータの完全な定義
 */
export interface ParamDefinition {
  /** デフォルト値 */
  defaultValue: OpencvParamValue;
  /** 入力パラメータのタイプ（UI用） */
  type: 'number' | 'text' | 'select' | 'tuple' | 'boolean';
  /** 表示ラベル（UI用、省略時はnameを使用） */
  label?: string;
  /** 入力ステップ（UI用、例: 奇数のみの場合2） */
  step?: number;
  /** 最小値（UI用） */
  min?: number;
  /** 選択肢（UI用、type='select'の場合） */
  options?: { label: string; value: number | string | boolean }[];
  /** AI用の詳細説明 */
  aiDescription: string;
}

/**
 * 処理関数の完全な定義
 */
export interface ProcessFunctionDefinition {
  /** 日本語表示名 */
  displayName: string;
  /** 基本説明 */
  description: string;
  /** アイコン名 */
  icon: string;
  /** パラメータ定義（キー: パラメータ名） */
  params: Record<string, ParamDefinition>;
}

/**
 * 全処理ノードの統合定義
 * 新しいノードを追加する場合はここに追加する
 */
export const PROCESS_FUNCTIONS_BASE: Record<ProcessNodeFunctionName, ProcessFunctionDefinition> = {
  createclahe: {
    displayName: 'CLAHE（コントラスト制限適応ヒストグラム均等化）',
    description: '画像のコントラストを自動的に均等化する処理です。局所的なコントラストを改善し、暗い部分や明るい部分の詳細を引き出します。',
    icon: 'histogram',
    params: {
      clipLimit: {
        defaultValue: 40.0,
        type: 'number',
        aiDescription: 'コントラスト制限のしきい値（デフォルト: 40.0）。値が大きいほどコントラストが強くなります。',
      },
      tileGridSize: {
        defaultValue: [8, 8],
        type: 'tuple',
        label: 'tileGridSize (x, y)',
        aiDescription: 'タイルグリッドのサイズ [幅, 高さ]（デフォルト: [8, 8]）。画像を分割するグリッドの大きさを指定します。',
      },
    },
  },
  gaussianblur: {
    displayName: 'ガウシアンブラー',
    description: 'ガウシアン分布に基づくブラー（ぼかし）処理です。ノイズ除去や画像の平滑化に使用します。',
    icon: 'brush',
    params: {
      ksize: {
        defaultValue: [5, 5],
        type: 'tuple',
        label: 'ksize (width, height)',
        step: 2,
        min: 1,
        aiDescription: 'カーネルサイズ [幅, 高さ]（デフォルト: [5, 5]）。奇数である必要があります。値が大きいほどぼかしが強くなります。',
      },
      sigmaX: {
        defaultValue: 0,
        type: 'number',
        aiDescription: 'X方向の標準偏差（デフォルト: 0）。0の場合はカーネルサイズから自動計算されます。',
      },
      sigmaY: {
        defaultValue: 0,
        type: 'number',
        aiDescription: 'Y方向の標準偏差（デフォルト: 0）。0の場合はsigmaXと同じ値が使用されます。',
      },
    },
  },
  grayscale: {
    displayName: 'グレイスケール変換',
    description: 'カラー画像をグレイスケール（白黒）に変換します。オプションで二値化しきい値を適用できます。',
    icon: 'palette',
    params: {
      enableThreshold: {
        defaultValue: false,
        type: 'boolean',
        label: 'Threshold',
        aiDescription: '二値化しきい値を有効にするかどうか（デフォルト: false）。',
      },
      threshold: {
        defaultValue: 128,
        type: 'number',
        label: 'Threshold Value (0-255)',
        aiDescription: '二値化のしきい値 0-255（デフォルト: 128）。enableThresholdがtrueの場合に使用されます。',
      },
    },
  },
  remove_noise: {
    displayName: 'ノイズ除去（メディアンブラー）',
    description: 'メディアンフィルタを用いてノイズを除去します。特にソルト＆ペッパーノイズに効果的です。',
    icon: 'settings',
    params: {},
  },
  restore_brightness: {
    displayName: '明るさ復元',
    description: '明るさを補正します。値が負の場合は明るくし、正の場合は暗くします。',
    icon: 'image',
    params: {
      value: {
        defaultValue: -30,
        type: 'number',
        label: 'Brightness Value',
        aiDescription: '明るさの調整値（デフォルト: -30）。正の値で明るく、負の値で暗くなります。',
      },
    },
  },
  restore_contrast: {
    displayName: 'コントラスト復元（ガンマ補正）',
    description: 'ガンマ補正を用いてコントラストを調整します。画像の明暗バランスを改善できます。',
    icon: 'image',
    params: {
      gamma: {
        defaultValue: 1.7,
        type: 'number',
        label: 'Gamma',
        aiDescription: 'ガンマ値（デフォルト: 1.7）。1.0未満で暗くなり、1.0より大きいと明るくなります。',
      },
    },
  },
  model_inference: {
    displayName: 'モデル推論（Patchcore異常検知）',
    description: 'Patchcoreモデルによる異常検知推論を実行し、ヒートマップオーバーレイを返します。異常スコアも算出されます。',
    icon: 'scan',
    params: {
      overlayAlpha: {
        defaultValue: 0.6,
        type: 'number',
        label: 'Overlay Alpha',
        min: 0,
        step: 0.1,
        aiDescription: '元画像の重み（デフォルト: 0.6）。0〜1の範囲で指定します。',
      },
      heatmapAlpha: {
        defaultValue: 0.4,
        type: 'number',
        label: 'Heatmap Alpha',
        min: 0,
        step: 0.1,
        aiDescription: 'ヒートマップの重み（デフォルト: 0.4）。0〜1の範囲で指定します。',
      },
    },
  },
};
