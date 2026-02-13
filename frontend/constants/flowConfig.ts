import { EndNode } from '@/app/components/nodes/EndNode';
import { ProcessNode } from '@/app/components/nodes/ProcessNode';
import { StartNode } from '@/app/components/nodes/StartNode';
import { EXECUTION_STATUS, NODE_TYPE } from '@/constants/index';
import type { Edge, Node, NodeTypes } from '@xyflow/react';

// Define node types
export const nodeTypes: NodeTypes = {
  [NODE_TYPE.PROCESS]: ProcessNode,
  [NODE_TYPE.START]: StartNode,
  [NODE_TYPE.END]: EndNode,
};

/**
 * 初期ノードの定義
 */
export const initialNodes: Node[] = [
  {
    id: 'start',
    type: NODE_TYPE.START,
    position: { x: 50, y: 150 },
    data: { label: '入力' },
    deletable: false,
  },
  {
    id: 'clahe-demo',
    type: NODE_TYPE.PROCESS,
    position: { x: 250, y: 150 },
    data: {
      label: '適応的ヒストグラム平坦化',
      functionName: 'createclahe',
      params: { clipLimit: 40.0, tileGridSize: [8, 8] },
      executionStatus: EXECUTION_STATUS.IDLE,
      icon: 'histogram',
    },
  },
  {
    id: 'end',
    type: NODE_TYPE.END,
    position: { x: 500, y: 150 },
    data: { label: 'Result' },
    deletable: false,
  },
];

/** 初期のエッジ。何も接続されていない状態 */
export const initialEdges: Edge[] = [];
