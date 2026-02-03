'use client';

// 役割: ワークフロー画面のルート。FlowCanvasとInspectorPanelを束ねて状態と実行を管理する。
// 依存: useWorkflowExecutionで実行、flowConfigで初期ノード/エッジ定義。
import { ChatPanel } from '@/app/components/chat/ChatPanel';
import { FlowCanvas } from '@/app/components/workflow/FlowCanvas';
import { InspectorPanel } from '@/app/components/workflow/InspectorPanel';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { DEFAULT_NODE_PARAMS, type ProcessNodeData, type NodeDataUpdate } from '@/types/node';
import { NODE_TYPE, EXECUTION_STATUS } from '@/constants/index';
import type { WorkflowFile } from '@/types/workflow';
import { FlowStoreProvider, useFlowStore } from '@/workflow/flowStore';
import { initialEdges, initialNodes, nodeTypes } from '@/constants/flowConfig';
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
import { useCallback, useEffect, useState } from 'react';
import { InspectorProvider } from '@/contexts/InspectorContext';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { categorizeError } from '@/lib/errors';

import styles from './page.module.css';

type WorkflowContentProps = {
  initialHistoryEntries: FlowHistoryEntry[];
};

/**
 * ページは以下の三つの要素で構成されている
 * - FlowCanvas: ノードとエッジの表示と編集を担当
 * - InspectorPanel: 選択ノードの設定編集とスナップショット管理を担当
 * - ChatPanel: AIチャットインターフェースを担当
 */
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
  const { showError, showWarning } = useToast();

  // エラーハンドラ
  const handleExecutionError = useCallback((error: unknown) => {
    const appError = categorizeError(error);
    showError(appError);
  }, [showError]);

  // Image Upload & Result State
  const [files, setFiles] = useState<WorkflowFile[]>([]);
  const { executeWorkflow, resultImage } = useWorkflowExecution({
    nodes,
    edges,
    files,
    resetNodeExecutionStatuses,
    updateNodeExecutionStatus,
    updateNodeExecutionResult,
    onError: handleExecutionError,
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

  const handleResetCanvas = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(null);
    setFiles([]);
  }, [setNodes, setEdges]);

  const handleAddNode = useCallback(() => {
    const newNode: Node<ProcessNodeData> = {
      id: `node-${Date.now()}`,
      type: NODE_TYPE.PROCESS,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: 'New Node',
        functionName: 'createclahe',
        params: DEFAULT_NODE_PARAMS['createclahe'],
        executionStatus: EXECUTION_STATUS.IDLE,
        icon: 'histogram',
      },
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
        showWarning('接続エラー', error);
        return;
      }
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [edges, setEdges, showWarning]
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
        <ChatPanel />

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
          onResetCanvas={handleResetCanvas}
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
  // SSR では window が存在しないため空配列を返し、クライアントでは直接 localStorage から読む
  const [initialHistoryEntries] = useState<FlowHistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadFlowHistory();
  });
  const [isHydrated, setIsHydrated] = useState(false);

  // ハイドレート後にのみ描画を開始する。
  // SSR では window が存在しないため initialHistoryEntries は []になり、
  // クライアントの初回レンダルと不整合になる。このガードで描画を遅延させる。
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  // ハイドレート前はレンダルしない。
  // これにより FlowStoreProvider と WorkflowContent の初回マウントが
  // localStorage の読み込み後になり、useState の初期値が正しい値になる。
  if (!isHydrated) return null;

  const latestSnapshot = initialHistoryEntries[0]?.snapshot ?? null;
  const initialNodesState = latestSnapshot?.nodes ?? initialNodes;
  const initialEdgesState = latestSnapshot?.edges ?? initialEdges;

  return (
    <ErrorBoundary>
      <ToastProvider>
        <FlowStoreProvider
          initialNodes={initialNodesState}
          initialEdges={initialEdgesState}
          initialViewport={latestSnapshot?.viewport}
        >
          <WorkflowContent initialHistoryEntries={initialHistoryEntries} />
        </FlowStoreProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
