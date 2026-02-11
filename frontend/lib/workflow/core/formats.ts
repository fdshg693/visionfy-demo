/**
 * ワークフロー形式の定数と例
 *
 * このモジュールは形式ごとの定義、サンプルデータ、説明を提供
 */

import type { SimpleWorkflow, FlowSnapshot } from './types';

// ====================== Format Constants ======================

/**
 * 簡易形式の説明
 */
export const SIMPLE_FORMAT_DESCRIPTION = `
簡易形式（推奨）
- processNodesのみを定義
- START/ENDノード、位置、エッジは自動生成
- 人間が読みやすく、編集しやすい
- AIツールで使用される形式
`.trim();

/**
 * 完全形式の説明
 */
export const FULL_FORMAT_DESCRIPTION = `
完全形式
- nodes, edges, viewportを含む
- ノードの位置やズーム状態を保持
- 正確なレイアウト再現が必要な場合に使用
`.trim();

// ====================== Format Examples ======================

/**
 * 簡易形式のサンプル
 */
export const SIMPLE_FORMAT_EXAMPLE: SimpleWorkflow = {
  processNodes: [
    {
      functionName: 'createclahe',
      params: {
        clipLimit: 40,
        tileGridSize: [8, 8],
      },
    },
    {
      functionName: 'gaussianblur',
      params: {
        ksize: [5, 5],
        sigmaX: 1.5,
        sigmaY: 1.5,
      },
    },
  ],
};

/**
 * 完全形式のサンプル
 */
export const FULL_FORMAT_EXAMPLE: FlowSnapshot = {
  nodes: [
    {
      id: 'start',
      type: 'startNode',
      position: { x: 50, y: 150 },
      data: { label: 'Start' },
    },
    {
      id: 'node-1',
      type: 'processNode',
      position: { x: 200, y: 150 },
      data: {
        label: 'createclahe',
        functionName: 'createclahe',
        params: {
          clipLimit: 40,
          tileGridSize: [8, 8],
        },
      },
    },
    {
      id: 'end',
      type: 'endNode',
      position: { x: 350, y: 150 },
      data: { label: 'End' },
    },
  ],
  edges: [
    {
      id: 'xy-edge__start-node-1',
      source: 'start',
      target: 'node-1',
      style: { stroke: '#b1b1b7', strokeWidth: 2 },
      animated: true,
    },
    {
      id: 'xy-edge__node-1-end',
      source: 'node-1',
      target: 'end',
      style: { stroke: '#b1b1b7', strokeWidth: 2 },
      animated: true,
    },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

// ====================== Format Keys ======================

/**
 * 簡易形式のキー
 */
export const SIMPLE_FORMAT_KEYS = ['processNodes'] as const;

/**
 * 完全形式のキー
 */
export const FULL_FORMAT_KEYS = ['nodes', 'edges', 'viewport'] as const;
