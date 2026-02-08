/**
 * スナップショット履歴を管理するカスタムフック
 * 役割: フローの保存/復元/リネーム/削除ハンドラを提供
 * 依存: flowSerializer, flowPersistence, flowStore
 */
import { useCallback, useState } from 'react';
import { useFlowStore } from '@/workflow/flowStore';
import { toFlowSnapshot } from '@/workflow/flowSerializer';
import {
  saveFlowSnapshot,
  saveFlowHistory,
  type FlowHistoryEntry,
} from '@/workflow/flowPersistence';

export function useSnapshotHistory(initialEntries: FlowHistoryEntry[]) {
  const { nodes, edges, viewport, setNodes, setEdges, setViewport } = useFlowStore();
  const [historyEntries, setHistoryEntries] = useState<FlowHistoryEntry[]>(() => initialEntries);

  const handleSaveSnapshot = useCallback(() => {
    const snapshot = toFlowSnapshot(nodes, edges, viewport);
    const entry = saveFlowSnapshot(snapshot);
    setHistoryEntries((current) => [entry, ...current].slice(0, 20));
  }, [nodes, edges, viewport]);

  const handleRenameSnapshot = useCallback(
    (entryId: string, name: string) => {
      setHistoryEntries((current) => {
        const next = current.map((entry) =>
          entry.id === entryId ? { ...entry, name: name.trim() } : entry
        );
        saveFlowHistory(next);
        return next;
      });
    },
    []
  );

  const handleDeleteSnapshot = useCallback((entryId: string) => {
    setHistoryEntries((current) => {
      const next = current.filter((entry) => entry.id !== entryId);
      saveFlowHistory(next);
      return next;
    });
  }, []);

  const handleRestoreSnapshot = useCallback(
    (entry: FlowHistoryEntry) => {
      setNodes(entry.snapshot.nodes);
      setEdges(entry.snapshot.edges);
      setViewport(entry.snapshot.viewport);
    },
    [setNodes, setEdges, setViewport]
  );

  return {
    historyEntries,
    handleSaveSnapshot,
    handleRenameSnapshot,
    handleDeleteSnapshot,
    handleRestoreSnapshot,
  };
}
