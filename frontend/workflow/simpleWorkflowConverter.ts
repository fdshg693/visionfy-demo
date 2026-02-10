/**
 * 簡易ワークフロー形式 → FlowSnapshot 変換
 *
 * SimpleWorkflow（最小限の情報）から完全なFlowSnapshotを自動生成する。
 * - START/ENDノードの自動生成
 * - プロセスノードの位置自動計算（水平方向に150px間隔、y=150固定）
 * - エッジの自動生成（START → node1 → ... → nodeN → END）
 * - デフォルトviewportの設定
 */

import type { Node, Edge, Viewport } from '@xyflow/react';
import type { SimpleWorkflow, SimpleProcessNode } from '@/types/simpleWorkflow';
import type { ProcessNodeData, ProcessNodeFunctionName, ProcessNodeParamsMap } from '@/types/node';
import { DEFAULT_NODE_PARAMS } from '@/types/node';
import type { FlowSnapshot } from './flowSerializer';

// ノード配置の定数
const NODE_SPACING = 150; // ノード間の水平間隔（px）
const BASE_Y = 150; // 全ノードの垂直位置（y座標）
const START_X = 50; // STARTノードのx座標

// エッジのデフォルトスタイル
const DEFAULT_EDGE_STYLE = {
  stroke: '#b1b1b7',
  strokeWidth: 2,
};

/**
 * STARTノードを生成
 */
const createStartNode = (): Node => ({
  id: 'start',
  type: 'startNode',
  position: { x: START_X, y: BASE_Y },
  data: { label: 'Start' },
});

/**
 * ENDノードを生成
 * @param xPosition - x座標（プロセスノード数に応じて決定される）
 */
const createEndNode = (xPosition: number): Node => ({
  id: 'end',
  type: 'endNode',
  position: { x: xPosition, y: BASE_Y },
  data: { label: 'End' },
});

/**
 * プロセスノードのparamsをマージ（デフォルト値 + ユーザー指定値）
 */
const mergeParams = <T extends ProcessNodeFunctionName>(
  functionName: T,
  userParams?: Partial<ProcessNodeParamsMap[T]>
): ProcessNodeParamsMap[T] => {
  const defaultParams = DEFAULT_NODE_PARAMS[functionName];

  if (!userParams) {
    return defaultParams;
  }

  // Deep merge for nested objects (e.g., tileGridSize, ksize)
  return { ...defaultParams, ...userParams } as ProcessNodeParamsMap[T];
};

/**
 * 簡易プロセスノードから完全なReact Flowノードを生成
 * @param simpleNode - 簡易ノード定義
 * @param index - 配列内のインデックス（位置計算に使用）
 */
const createProcessNode = (simpleNode: SimpleProcessNode, index: number): Node => {
  const { functionName, params: userParams } = simpleNode;

  // パラメータをデフォルト値とマージ
  const params = mergeParams(functionName, userParams);

  // プロセスノードのdata
  const data: ProcessNodeData = {
    label: functionName,
    functionName,
    params,
  } as ProcessNodeData; // Type assertion needed due to discriminated union

  // x座標: START + (index + 1) * NODE_SPACING
  const xPosition = START_X + (index + 1) * NODE_SPACING;

  return {
    id: `node-${Date.now()}-${index}`,
    type: 'processNode',
    position: { x: xPosition, y: BASE_Y },
    data,
  };
};

/**
 * エッジを生成
 * @param source - ソースノードID
 * @param target - ターゲットノードID
 */
const createEdge = (source: string, target: string): Edge => ({
  id: `xy-edge__${source}-${target}`,
  source,
  target,
  style: DEFAULT_EDGE_STYLE,
  animated: true,
});

/**
 * デフォルトviewportを生成
 */
const createDefaultViewport = (): Viewport => ({
  x: 0,
  y: 0,
  zoom: 1,
});

/**
 * SimpleWorkflow → FlowSnapshot 変換
 *
 * @param simpleWorkflow - 簡易ワークフロー定義
 * @returns 完全なFlowSnapshot
 *
 * @example
 * const simple = {
 *   processNodes: [
 *     { functionName: 'createclahe', params: { clipLimit: 40 } },
 *     { functionName: 'grayscale' } // params省略 → デフォルト値適用
 *   ]
 * };
 * const snapshot = convertSimpleWorkflowToSnapshot(simple);
 * // → START → CLAHE → Grayscale → END の完全なワークフロー
 */
export const convertSimpleWorkflowToSnapshot = (
  simpleWorkflow: SimpleWorkflow
): FlowSnapshot => {
  const { processNodes: simpleProcessNodes } = simpleWorkflow;

  // 1. ノード生成
  const startNode = createStartNode();
  const processNodes = simpleProcessNodes.map(createProcessNode);
  const endNode = createEndNode(
    START_X + (simpleProcessNodes.length + 1) * NODE_SPACING
  );

  const nodes: Node[] = [startNode, ...processNodes, endNode];

  // 2. エッジ生成（START → node1 → node2 → ... → END）
  const edges: Edge[] = [];

  // START → 最初のプロセスノード
  if (processNodes.length > 0) {
    edges.push(createEdge('start', processNodes[0].id));

    // プロセスノード間のエッジ
    for (let i = 0; i < processNodes.length - 1; i++) {
      edges.push(createEdge(processNodes[i].id, processNodes[i + 1].id));
    }

    // 最後のプロセスノード → END
    edges.push(createEdge(processNodes[processNodes.length - 1].id, 'end'));
  } else {
    // プロセスノードが0個の場合: START → END
    edges.push(createEdge('start', 'end'));
  }

  // 3. viewport生成
  const viewport = createDefaultViewport();

  return {
    nodes,
    edges,
    viewport,
  };
};
