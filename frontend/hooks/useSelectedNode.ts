import type { Node } from '@xyflow/react';
import { useCallback, useMemo, useState } from 'react';

/**
 * ノード選択状態を管理するカスタムフック
 * FlowCanvas上でのノードクリック/ペインクリックによる選択・選択解除を一元管理する
 */
export function useSelectedNode(nodes: Node[]) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return { selectedNode, handleNodeClick, handlePaneClick, clearSelection };
}
