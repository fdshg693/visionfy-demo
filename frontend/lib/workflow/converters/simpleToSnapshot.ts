/**
 * SimpleWorkflow → FlowSnapshot 変換
 *
 * 簡易ワークフロー定義から完全なReact Flowスナップショットを生成
 * - START/ENDノードの自動生成
 * - プロセスノードの位置自動計算
 * - エッジの自動生成
 * - デフォルトviewportの設定
 */

import { PROCESS_FUNCTIONS_BASE } from '@/types/processFunctionBase';
import type { ProcessNodeData, ProcessNodeFunctionName, ProcessNodeParamsMap } from '@/types/processNode';
import { DEFAULT_NODE_PARAMS } from '@/types/processNode';
import type { Edge, Node, Viewport } from '@xyflow/react';
import { FormatConversionError } from '../core/errors';
import type { FlowSnapshot, SimpleProcessNode, SimpleWorkflow } from '../core/types';

// ====================== Layout Constants ======================

/**
 * ノード間の水平スペース（px）
 */
const NODE_SPACING = 150;

/**
 * すべてのノードの垂直位置（px）
 */
const BASE_Y = 150;

/**
 * STARTノードの開始X座標（px）
 */
const START_X = 50;

// ====================== Edge Style ======================

/**
 * デフォルトエッジスタイル
 */
const DEFAULT_EDGE_STYLE = {
  stroke: '#b1b1b7',
  strokeWidth: 2,
};

// ====================== Node Creators ======================

/**
 * STARTノードを生成
 */
function createStartNode(): Node {
  return {
    id: 'start',
    type: 'startNode',
    position: { x: START_X, y: BASE_Y },
    data: { label: 'Start' },
  };
}

/**
 * ENDノードを生成
 *
 * @param xPosition - X座標
 */
function createEndNode(xPosition: number): Node {
  return {
    id: 'end',
    type: 'endNode',
    position: { x: xPosition, y: BASE_Y },
    data: { label: 'End' },
  };
}

/**
 * プロセスノードのparamsをマージ（デフォルト値 + ユーザー指定値）
 *
 * @param functionName - 処理関数名
 * @param userParams - ユーザー指定パラメータ（オプション）
 * @returns マージされたパラメータ
 */
function mergeParams<T extends ProcessNodeFunctionName>(
  functionName: T,
  userParams?: Partial<ProcessNodeParamsMap[T]>
): ProcessNodeParamsMap[T] {
  const defaultParams = DEFAULT_NODE_PARAMS[functionName];
  if (!userParams) {
    return defaultParams;
  }
  return { ...defaultParams, ...userParams } as ProcessNodeParamsMap[T];
}

/**
 * 簡易プロセスノードから完全なReact Flowノードを生成
 *
 * @param simpleNode - 簡易プロセスノード
 * @param index - ノードのインデックス
 * @returns React Flowノード
 */
function createProcessNode(simpleNode: SimpleProcessNode, index: number): Node {
  const { functionName, params: userParams } = simpleNode;

  // パラメータマージ
  const params = mergeParams(functionName, userParams);

  // ProcessNodeDataの構築
  const data: ProcessNodeData = {
    label: PROCESS_FUNCTIONS_BASE[functionName].displayName,
    functionName,
    params,
  } as ProcessNodeData;

  // X座標の計算: START_X + (index + 1) * NODE_SPACING
  const xPosition = START_X + (index + 1) * NODE_SPACING;

  return {
    id: `node-${Date.now()}-${index}`,
    type: 'processNode',
    position: { x: xPosition, y: BASE_Y },
    data,
  };
}

/**
 * エッジを生成
 *
 * @param source - ソースノードID
 * @param target - ターゲットノードID
 * @returns エッジ
 */
function createEdge(source: string, target: string): Edge {
  return {
    id: `xy-edge__${source}-${target}`,
    source,
    target,
    style: DEFAULT_EDGE_STYLE,
    animated: true,
  };
}

/**
 * デフォルトviewportを生成
 */
function createDefaultViewport(): Viewport {
  return {
    x: 0,
    y: 0,
    zoom: 1,
  };
}

// ====================== Main Converter ======================

/**
 * SimpleWorkflow → FlowSnapshot 変換
 *
 * 簡易ワークフロー定義から完全なFlowSnapshotを自動生成：
 * 1. STARTノードを生成
 * 2. 各processNodeをReact FlowノードとしてFl成（位置自動計算）
 * 3. ENDノードを生成
 * 4. ノード間のエッジを自動生成
 * 5. デフォルトviewportを設定
 *
 * @param simpleWorkflow - 簡易ワークフロー
 * @returns FlowSnapshot
 * @throws {FormatConversionError} 変換に失敗した場合
 *
 * @example
 * ```typescript
 * const simple: SimpleWorkflow = {
 *   processNodes: [
 *     { functionName: 'createclahe', params: { clipLimit: 40 } },
 *     { functionName: 'gaussianblur', params: { ksize: [5, 5] } }
 *   ]
 * };
 *
 * const snapshot = convertSimpleWorkflowToSnapshot(simple);
 * // snapshot.nodes: [START, CLAHE, GaussianBlur, END]
 * // snapshot.edges: [START→CLAHE, CLAHE→GaussianBlur, GaussianBlur→END]
 * ```
 */
export function convertSimpleWorkflowToSnapshot(
  simpleWorkflow: SimpleWorkflow
): FlowSnapshot {
  try {
    const { processNodes: simpleProcessNodes } = simpleWorkflow;

    // ノードの生成
    const startNode = createStartNode();
    const processNodes = simpleProcessNodes.map(createProcessNode);
    const endNode = createEndNode(
      START_X + (simpleProcessNodes.length + 1) * NODE_SPACING
    );

    const nodes: Node[] = [startNode, ...processNodes, endNode];

    // エッジの生成
    const edges: Edge[] = [];

    if (processNodes.length > 0) {
      // START → 最初のプロセスノード
      edges.push(createEdge('start', processNodes[0].id));

      // プロセスノード間
      for (let i = 0; i < processNodes.length - 1; i++) {
        edges.push(createEdge(processNodes[i].id, processNodes[i + 1].id));
      }

      // 最後のプロセスノード → END
      edges.push(createEdge(processNodes[processNodes.length - 1].id, 'end'));
    } else {
      // プロセスノードがない場合は START → END
      edges.push(createEdge('start', 'end'));
    }

    // viewportの生成
    const viewport = createDefaultViewport();

    return {
      nodes,
      edges,
      viewport,
    };
  } catch (error) {
    throw new FormatConversionError(
      `SimpleWorkflow → FlowSnapshotの変換に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      'CONVERSION_FAILED'
    );
  }
}
