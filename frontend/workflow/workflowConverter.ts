/**
 * ワークフロー形式間の相互変換
 *
 * このモジュールは以下の変換機能を提供：
 * 1. SimpleWorkflow ↔ FlowSnapshot の相互変換
 * 2. ランタイムデータの除去（永続化用）
 * 3. 後方互換のための正規化
 */

import type { Edge, Node, Viewport } from '@xyflow/react';
import type { ProcessNodeData, ProcessNodeFunctionName, ProcessNodeParamsMap } from '@/types/processNode';
import { DEFAULT_NODE_PARAMS } from '@/types/processNode';
import { isProcessNodeData } from '@/types/typeGuards';
import type { SimpleWorkflow, SimpleProcessNode } from '@/types/simpleWorkflow';
import type { FlowSnapshot } from '@/types/workflowPersistence';

// ====================== ランタイムデータの除去（永続化用） ======================

/**
 * プロセスノードから永続化する項目を明示的に抽出
 */
const pickProcessNodeData = (data: ProcessNodeData) => ({
  label: data.label,
  functionName: data.functionName,
  params: data.params,
});

/**
 * プロセスノードではない、基本的なノードデータを抽出
 */
const pickBasicNodeData = (data: Record<string, unknown>): Record<string, unknown> => {
  if (typeof data.label === 'string') {
    return { label: data.label };
  }
  return {};
};

/**
 * ノードから実行時データを除去し、永続化可能なノードを返す
 * 除去されるフィールド: executionStatus, result, resultParams, icon
 */
export const stripRuntimeNodeData = (node: Node): Node => {
  if (isProcessNodeData(node.data)) {
    return {
      ...node,
      data: pickProcessNodeData(node.data),
    };
  }

  const basicData = pickBasicNodeData(node.data as Record<string, unknown>);
  return {
    ...node,
    data: basicData,
  };
};

/**
 * フロー全体のスナップショットを取得
 * 全ノードからランタイムデータを除去して返す
 */
export const toFlowSnapshot = (
  nodes: Node[],
  edges: Edge[],
  viewport: Viewport
): FlowSnapshot => {
  return {
    nodes: nodes.map(stripRuntimeNodeData),
    edges,
    viewport,
  };
};

// ====================== 後方互換の正規化 ======================

/**
 * 後方互換のためのスナップショット正規化
 * 旧形式: type: 'custom' → 新形式: type: 'processNode'
 */
export const normalizeSnapshot = (snapshot: FlowSnapshot): FlowSnapshot => {
  return {
    ...snapshot,
    nodes: snapshot.nodes.map((node) =>
      node.type === 'custom' ? { ...node, type: 'processNode' } : node
    ),
  };
};

// ====================== SimpleWorkflow → FlowSnapshot ======================

// ノード配置の定数
const NODE_SPACING = 150;
const BASE_Y = 150;
const START_X = 50;

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
  return { ...defaultParams, ...userParams } as ProcessNodeParamsMap[T];
};

/**
 * 簡易プロセスノードから完全なReact Flowノードを生成
 */
const createProcessNode = (simpleNode: SimpleProcessNode, index: number): Node => {
  const { functionName, params: userParams } = simpleNode;
  const params = mergeParams(functionName, userParams);

  const data: ProcessNodeData = {
    label: functionName,
    functionName,
    params,
  } as ProcessNodeData;

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
 * 簡易ワークフロー定義から完全なFlowSnapshotを自動生成
 * - START/ENDノードの自動生成
 * - プロセスノードの位置自動計算
 * - エッジの自動生成
 * - デフォルトviewportの設定
 */
export const convertSimpleWorkflowToSnapshot = (
  simpleWorkflow: SimpleWorkflow
): FlowSnapshot => {
  const { processNodes: simpleProcessNodes } = simpleWorkflow;

  const startNode = createStartNode();
  const processNodes = simpleProcessNodes.map(createProcessNode);
  const endNode = createEndNode(
    START_X + (simpleProcessNodes.length + 1) * NODE_SPACING
  );

  const nodes: Node[] = [startNode, ...processNodes, endNode];

  const edges: Edge[] = [];

  if (processNodes.length > 0) {
    edges.push(createEdge('start', processNodes[0].id));

    for (let i = 0; i < processNodes.length - 1; i++) {
      edges.push(createEdge(processNodes[i].id, processNodes[i + 1].id));
    }

    edges.push(createEdge(processNodes[processNodes.length - 1].id, 'end'));
  } else {
    edges.push(createEdge('start', 'end'));
  }

  const viewport = createDefaultViewport();

  return {
    nodes,
    edges,
    viewport,
  };
};

// ====================== FlowSnapshot → SimpleWorkflow ======================

/**
 * FlowSnapshot → SimpleWorkflow 逆変換
 *
 * 完全なワークフローからprocessNodesのみを抽出
 * - processNode以外（START/END）は除外
 * - 位置情報、エッジ、viewportは除外
 * - パラメータのみ保持
 */
export const convertSnapshotToSimpleWorkflow = (
  snapshot: FlowSnapshot
): SimpleWorkflow => {
  const processNodes: SimpleProcessNode[] = snapshot.nodes
    .filter((node) => node.type === 'processNode' && isProcessNodeData(node.data))
    .map((node) => {
      const data = node.data as ProcessNodeData;
      return {
        functionName: data.functionName,
        params: data.params,
      };
    });

  return {
    processNodes,
  };
};
