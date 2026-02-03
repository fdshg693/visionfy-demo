// 役割: ノード/エッジのキャンバス表示と操作UI(ミニマップ/ズーム/追加ボタン/リセット/右クリック削除)を提供する。
// 依存: ReactFlowのイベントを受け取り、親から渡された状態更新に委譲する。
import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
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

type ContextMenuState = {
  x: number;
  y: number;
  type: 'node' | 'edge';
  id: string;
};

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
  onResetCanvas: () => void;
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
  onResetCanvas,
}: FlowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Escape キーでコンテキストメニューを閉じる
  useEffect(() => {
    if (!contextMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu, closeContextMenu]);

  // コンテナ相対のマウス座標を返す
  const getRelativePosition = useCallback((event: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      const pos = getRelativePosition(event);
      setContextMenu({ ...pos, type: 'node', id: node.id });
    },
    [getRelativePosition]
  );

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      const pos = getRelativePosition(event);
      setContextMenu({ ...pos, type: 'edge', id: edge.id });
    },
    [getRelativePosition]
  );

  // コンテキストメニューから削除を実行する
  const handleDelete = useCallback(() => {
    if (!contextMenu) return;
    if (contextMenu.type === 'node') {
      onNodesChange?.([{ type: 'remove', id: contextMenu.id }]);
      // そのノードに接続されているエッジも削除
      const connectedEdgeChanges = edges
        .filter((e) => e.source === contextMenu.id || e.target === contextMenu.id)
        .map((e) => ({ type: 'remove' as const, id: e.id }));
      if (connectedEdgeChanges.length > 0) {
        onEdgesChange?.(connectedEdgeChanges);
      }
    } else {
      onEdgesChange?.([{ type: 'remove', id: contextMenu.id }]);
    }
    closeContextMenu();
  }, [contextMenu, edges, onNodesChange, onEdgesChange, closeContextMenu]);

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
