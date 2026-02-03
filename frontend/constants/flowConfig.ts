import { EndNode } from '@/app/components/nodes/EndNode';
import { ProcessNode } from '@/app/components/nodes/ProcessNode';
import { StartNode } from '@/app/components/nodes/StartNode';
import { NODE_TYPE, EXECUTION_STATUS } from '@/constants/index';
import type { NodeTypes, Edge, Node } from '@xyflow/react';

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
    data: { label: 'Start' },
  },
  {
    id: 'clahe-demo',
    type: NODE_TYPE.PROCESS,
    position: { x: 250, y: 150 },
    data: {
      label: 'CLAHE',
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
    data: { label: 'End' },
  },
];

/** 初期のエッジ。何も接続されていない状態 */
export const initialEdges: Edge[] = [];
