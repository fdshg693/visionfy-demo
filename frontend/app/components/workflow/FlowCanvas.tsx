// 役割: ノード/エッジのキャンバス表示と操作UI(ミニマップ/ズーム/追加ボタン/リセット/右クリック削除)を提供する。
// 依存: ReactFlowのイベントを受け取り、親から渡された状態更新に委譲する。
import { type ComponentProps } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeTypes,
} from '@xyflow/react';
import { useFlowStore } from '@/workflow/flowStore';
import { useContextMenu } from '@/hooks/useContextMenu';

import styles from '@/app/page.module.css';

type FlowCanvasProps = {
  nodeTypes: NodeTypes;
  defaultViewport?: ComponentProps<typeof ReactFlow>['defaultViewport'];
  onConnect: ComponentProps<typeof ReactFlow>['onConnect'];
  onNodeClick: ComponentProps<typeof ReactFlow>['onNodeClick'];
  onPaneClick: ComponentProps<typeof ReactFlow>['onPaneClick'];
  onMoveEnd?: ComponentProps<typeof ReactFlow>['onMoveEnd'];
  onAddNode: () => void;
  onResetCanvas: () => void;
};

/**
 * フローカンバスコンポーネント
 * ノードとエッジの表示および操作UIを提供します。
 */
export function FlowCanvas({
  nodeTypes,
  defaultViewport,
  onConnect,
  onNodeClick,
  onPaneClick,
  onMoveEnd,
  onAddNode,
  onResetCanvas,
}: FlowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange } = useFlowStore();
  const {
    containerRef,
    contextMenu,
    closeContextMenu,
    handleNodeContextMenu,
    handleEdgeContextMenu,
    handleDelete,
  } = useContextMenu(edges, onNodesChange, onEdgesChange);

  return (
    <div className={styles.flowArea} ref={containerRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onMoveEnd={onMoveEnd}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
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
          onClick={onResetCanvas}
          className={styles.addBtn}
        >
          ↺ Reset
        </button>
        <button
          onClick={onAddNode}
          className={styles.addBtn}
        >
          ＋ Add Node
        </button>
      </div>

      {contextMenu && (
        <>
          <div className={styles.contextMenuOverlay} onClick={closeContextMenu} />
          <div
            className={styles.contextMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button className={styles.contextMenuItem} onClick={handleDelete}>
              削除
            </button>
          </div>
        </>
      )}
    </div>
  );
}
