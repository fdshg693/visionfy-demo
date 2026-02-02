'use client';

// 役割: ワークフロー画面のルート。FlowCanvasとInspectorPanelを束ねて状態と実行を管理する。
// 依存: useWorkflowExecutionで実行、flowConfigで初期ノード/エッジ定義。
import { FlowCanvas } from '@/app/components/workflow/FlowCanvas';
import { InspectorPanel } from '@/app/components/workflow/InspectorPanel';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { DEFAULT_NODE_PARAMS, type ProcessNodeData, type NodeDataUpdate } from '@/types/node';
import type { WorkflowFile } from '@/types/workflow';
import { FlowStoreProvider, useFlowStore } from '@/workflow/flowStore';
import { initialEdges, initialNodes, nodeTypes } from '@/workflow/flowConfig';
import { toFlowSnapshot } from '@/workflow/flowSerializer';
import { getConnectionConstraintError } from '@/workflow/connectionConstraints';
import {
  loadFlowHistory,
  saveFlowSnapshot,
  saveFlowHistory,
  type FlowHistoryEntry,
} from '@/workflow/flowPersistence';
import {
  addEdge,
  type Connection,
  type Node,
  type OnConnect,
  type OnMove,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useMemo, useState } from 'react';
import { InspectorProvider } from '@/contexts/InspectorContext';

import styles from './page.module.css';

type WorkflowContentProps = {
  initialHistoryEntries: FlowHistoryEntry[];
};

function WorkflowContent({ initialHistoryEntries }: WorkflowContentProps) {
  const {
    nodes,
    edges,
    viewport,
    setNodes,
    setEdges,
    setViewport,
    onNodesChange,
    onEdgesChange,
    updateNodeData,
    resetNodeExecutionStatuses,
    updateNodeExecutionStatus,
    updateNodeExecutionResult,
  } = useFlowStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<FlowHistoryEntry[]>(() => initialHistoryEntries);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'inspector' | 'snapshot'>('inspector');

  // Image Upload & Result State
  const [files, setFiles] = useState<WorkflowFile[]>([]);
  const { executeWorkflow, resultImage } = useWorkflowExecution({
    nodes,
    edges,
    files,
    resetNodeExecutionStatuses,
    updateNodeExecutionStatus,
    updateNodeExecutionResult,
  });

  // ========== Snapshot Handlers ==========

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

  // ========== Node Handlers ==========

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, newData: NodeDataUpdate) => {
    updateNodeData(nodeId, newData);
  }, [updateNodeData]);

  const handleAddNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'processNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: 'New Node',
        functionName: 'createclahe',
        params: DEFAULT_NODE_PARAMS['createclahe'],
        executionStatus: 'idle',
        icon: 'histogram',
      } as ProcessNodeData,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
  const handleMoveEnd: OnMove = useCallback(
    (_event, nextViewport: Viewport) => {
      setViewport(nextViewport);
    },
    [setViewport]
  );

  // ========= Other Handlers ==========

  // 接続時の制約チェック
  // 1つのノードからの出力は1つまで、1つのノードへの入力は1つまで
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const error = getConnectionConstraintError(params, edges);
      if (error) {
        alert(error);
        return;
      }
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [edges, setEdges]
  );
  
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <InspectorProvider
      value={{
        files,
        setFiles,
        resultImage,
        executeWorkflow,
        nodes,
      }}
    >
      <div className={styles.container}>
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultViewport={viewport}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onMoveEnd={handleMoveEnd}
          onAddNode={handleAddNode}
        />

        <InspectorPanel
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
          historyEntries={historyEntries}
          onSaveSnapshot={handleSaveSnapshot}
          onRestoreSnapshot={handleRestoreSnapshot}
          onRenameSnapshot={handleRenameSnapshot}
          onDeleteSnapshot={handleDeleteSnapshot}
          activeTab={activeInspectorTab}
          onChangeTab={setActiveInspectorTab}
        />
      </div>
    </InspectorProvider>
  );
}

export default function Home() {
  const initialHistoryEntries = useMemo(() => loadFlowHistory(), []);
  const latestSnapshot = initialHistoryEntries[0]?.snapshot ?? null;
  const initialNodesState = latestSnapshot?.nodes ?? initialNodes;
  const initialEdgesState = latestSnapshot?.edges ?? initialEdges;

  return (
    <FlowStoreProvider
      initialNodes={initialNodesState}
      initialEdges={initialEdgesState}
      initialViewport={latestSnapshot?.viewport}
    >
      <WorkflowContent initialHistoryEntries={initialHistoryEntries} />
    </FlowStoreProvider>
  );
}
