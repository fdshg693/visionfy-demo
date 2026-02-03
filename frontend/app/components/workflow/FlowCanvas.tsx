// 役割: ノード/エッジのキャンバス表示と操作UI(ミニマップ/ズーム/追加ボタン)を提供する。
// 依存: ReactFlowのイベントを受け取り、親から渡された状態更新に委譲する。
import type { ComponentProps } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react';

import styles from '@/app/page.module.css';

type FlowCanvasProps = {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  defaultViewport?: ComponentProps<typeof ReactFlow>['defaultViewport'];
  onNodesChange: ComponentProps<typeof ReactFlow>['onNodesChange'];
  onEdgesChange: ComponentProps<typeof ReactFlow>['onEdgesChange'];
  onConnect: ComponentProps<typeof ReactFlow>['onConnect'];
  onNodeClick: ComponentProps<typeof ReactFlow>['onNodeClick'];
  onPaneClick: ComponentProps<typeof ReactFlow>['onPaneClick'];
  onMoveEnd?: ComponentProps<typeof ReactFlow>['onMoveEnd'];
  onAddNode: () => void;
};

/**
 * フローカンバスコンポーネント
 * ノードとエッジの表示および操作UIを提供します。
 */
export function FlowCanvas({
  nodes,
  edges,
  nodeTypes,
  defaultViewport,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onMoveEnd,
  onAddNode,
}: FlowCanvasProps) {
  return (
    <div className={styles.flowArea}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        fitView
        colorMode="light"
        defaultEdgeOptions={{
          style: { stroke: '#b1b1b7', strokeWidth: 2 },
          animated: true,
        }}
      >
        <Controls />
        <MiniMap />
        <Background color="#e5e7eb" gap={20} size={1} />
      </ReactFlow>

      <div className={styles.toolbar}>
        <button
          onClick={onAddNode}
          className={styles.addBtn}
        >
          ＋ Add Node
        </button>
      </div>
    </div>
  );
}
