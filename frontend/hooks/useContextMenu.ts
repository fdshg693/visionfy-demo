/**
 * コンテキストメニューのロジックを管理するカスタムフック
 * 役割: ノード/エッジの右クリック削除メニューの状態管理とハンドラを提供
 */
import type { Edge, EdgeChange, Node, NodeChange } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type ContextMenuState = {
  x: number;
  y: number;
  type: 'node' | 'edge';
  id: string;
};

export function useContextMenu(
  edges: Edge[],
  onNodesChange: (changes: NodeChange[]) => void,
  onEdgesChange: (changes: EdgeChange[]) => void
) {
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
      // 削除不可のノードではメニューを表示しない
      if (node.deletable === false) return;

      event.preventDefault();
      const pos = getRelativePosition(event);
      setContextMenu({ ...pos, type: 'node', id: node.id });
    },
    [getRelativePosition]
  );

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      // エッジにも削除不可設定がある場合はここでチェック可能
      if (edge.deletable === false) return;

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
      onNodesChange([{ type: 'remove', id: contextMenu.id }]);
      // そのノードに接続されているエッジも削除
      const connectedEdgeChanges = edges
        .filter((e) => e.source === contextMenu.id || e.target === contextMenu.id)
        .map((e) => ({ type: 'remove' as const, id: e.id }));
      if (connectedEdgeChanges.length > 0) {
        onEdgesChange(connectedEdgeChanges);
      }
    } else {
      onEdgesChange([{ type: 'remove', id: contextMenu.id }]);
    }
    closeContextMenu();
  }, [contextMenu, edges, onNodesChange, onEdgesChange, closeContextMenu]);

  return {
    containerRef,
    contextMenu,
    closeContextMenu,
    handleNodeContextMenu,
    handleEdgeContextMenu,
    handleDelete,
  };
}
