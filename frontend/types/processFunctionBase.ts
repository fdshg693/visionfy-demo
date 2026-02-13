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
 * ノードカテゴリの定義
 * 目的別に分類し、メニューやノードの色に反映する
 */
export type ProcessNodeCategory = '明るさ調整' | 'ノイズ除去' | '色変換' | '推論';

/**
 * カテゴリ表示情報（アイコン・色など）
 */
export interface CategoryInfo {
  /** メニュー用アイコン */
  icon: string;
  /** ノードヘッダー背景色 */
  headerBg: string;
  /** ノードヘッダーボーダー色 */
  headerBorder: string;
  /** アイコン色 */
  iconColor: string;
}

/** カテゴリごとの表示情報 */
export const CATEGORY_INFO: Record<ProcessNodeCategory, CategoryInfo> = {
  '明るさ調整': {
    icon: '☀️',
    headerBg: '#fff7ed',
    headerBorder: '#ffedd5',
    iconColor: '#ea580c',
  },
  'ノイズ除去': {
    icon: '🔇',
    headerBg: '#eff6ff',
    headerBorder: '#dbeafe',
    iconColor: '#2563eb',
  },
  '色変換': {
    icon: '🎨',
    headerBg: '#f9fafb',
    headerBorder: '#f3f4f6',
    iconColor: '#6b7280',
  },
  '推論': {
    icon: '🔍',
    headerBg: '#fef2f2',
    headerBorder: '#fee2e2',
    iconColor: '#dc2626',
  },
};

/** カテゴリの表示順 */
export const CATEGORY_ORDER: ProcessNodeCategory[] = ['明るさ調整', 'ノイズ除去', '色変換', '推論'];

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
  /** 日本語表示名（短い名前） */
  displayName: string;
  /** 基本説明 */
  description: string;
  /** アイコン名 */
  icon: string;
  /** カテゴリ */
  category: ProcessNodeCategory;
  /** パラメータ定義（キー: パラメータ名） */
  params: Record<string, ParamDefinition>;
}

/**
 * 全処理ノードの統合定義
 * 新しいノードを追加する場合はここに追加する
 */
export const PROCESS_FUNCTIONS_BASE: Record<ProcessNodeFunctionName, ProcessFunctionDefinition> = {
  createclahe: {
    displayName: '適応的ヒストグラム平坦化',
    description: '画素値の分布を適応的に均等化します。不鮮明な画像を見やすくしたり、過度に鮮明な画像を調整したりできます。',
    icon: 'histogram',
    category: '明るさ調整',
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
    displayName: 'ガウシアンフィルタ',
    description: 'ガウシアンフィルタを用いてノイズを除去します。全体的にざらついている画像に対して効果的です。',
    icon: 'brush',
    category: 'ノイズ除去',
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
    displayName: 'グレースケール',
    description: 'カラー画像をグレースケール（白黒）に変換します。オプションで二値化しきい値を適用できます。',
    icon: 'palette',
    category: '色変換',
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
    displayName: 'メディアンフィルタ',
    description: 'メディアンフィルタを用いてノイズを除去します。特にソルト＆ペッパーノイズに効果的です。',
    icon: 'settings',
    category: 'ノイズ除去',
    params: {},
  },
  restore_brightness: {
    displayName: '輝度補正',
    description: '画像の明るさを全体的に補正します。値が負の場合は明るく、正の場合は暗くします。',
    icon: 'image',
    category: '明るさ調整',
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
    displayName: 'ガンマ補正',
    description: 'ガンマ補正を用いてコントラストを調整します。画像の明暗バランスを改善できます。',
    icon: 'image',
    category: '明るさ調整',
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
    displayName: '異常検知',
    description: 'Patchcoreモデルによる異常検知推論を実行し、ヒートマップオーバーレイを返します。異常スコアも算出されます。',
    icon: 'scan',
    category: '推論',
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
