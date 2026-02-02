import { EndNode } from '@/app/components/nodes/EndNode';
import { ProcessNode } from '@/app/components/nodes/ProcessNode';
import { StartNode } from '@/app/components/nodes/StartNode';
import type { NodeTypes, Edge, Node } from '@xyflow/react';

// Define node types
export const nodeTypes: NodeTypes = {
  processNode: ProcessNode,
  startNode: StartNode,
  endNode: EndNode,
};

// Initial Nodes with new data structure
export const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'startNode',
    position: { x: 50, y: 150 },
    data: { label: 'Start' },
  },
  {
    id: 'clahe-demo',
    type: 'processNode',
    position: { x: 250, y: 150 },
    data: {
      label: 'CLAHE',
      functionName: 'createclahe',
      params: { clipLimit: 40.0, tileGridSize: [8, 8] },
      executionStatus: 'idle',
      icon: 'histogram',
    },
  },
  {
    id: 'end',
    type: 'endNode',
    position: { x: 500, y: 150 },
    data: { label: 'End' },
  },
];

export const initialEdges: Edge[] = [];
