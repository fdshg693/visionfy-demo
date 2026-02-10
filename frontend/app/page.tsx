'use client';

// 役割: ワークフロー画面のルート。FlowCanvasとサイドバーを束ねて状態と実行を管理する。
// 依存: useWorkflowExecutionで実行、flowConfigで初期ノード/エッジ定義。
import { ChatPanel } from '@/app/components/chat/ChatPanel';
import { FlowCanvas } from '@/app/components/workflow/FlowCanvas';
import { InputImagePanel } from '@/app/components/workflow/InputImagePanel';
import { ResultInspector } from '@/app/components/inspectors/ResultNodeInspector';
import { ProcessNodePopup } from '@/app/components/workflow/ProcessNodePopup';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { useSnapshotHistory } from '@/hooks/useSnapshotHistory';
import { useSelectedNode } from '@/hooks/useSelectedNode';
import { DEFAULT_NODE_PARAMS, DEFAULT_NODE_ICONS, type ProcessNodeData, type ProcessNodeFunctionName, type NodeDataUpdate } from '@/types/processNode';
import { NODE_TYPE, EXECUTION_STATUS } from '@/constants/index';
import type { WorkflowFile } from '@/types/workflow';
import { FlowStoreProvider, useFlowStore } from '@/workflow/flowStore';
import { initialEdges, initialNodes, nodeTypes } from '@/constants/flowConfig';
import { getConnectionConstraintError } from '@/workflow/connectionConstraints';
import {
  loadFlowHistory,
  saveFlowSnapshot,
} from '@/workflow/flowPersistence';
import type { FlowHistoryEntry, FlowSnapshot } from '@/types/workflowPersistence';
import {
  addEdge,
  type Connection,
  type Node,
  type OnConnect,
  type OnMove,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InspectorProvider } from '@/contexts/InspectorContext';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { categorizeError } from '@/lib/errors';

import styles from './page.module.css';

type WorkflowContentProps = {
  initialHistoryEntries: FlowHistoryEntry[];
};

/**
 * ページは以下の要素で構成されている
 * - ChatPanel: AIチャットインターフェースを担当。
 * - FlowCanvas: ノードとエッジの表示と編集を担当。ツールバーでスナップショット管理も提供。
 * - Sidebar: 入力画像の表示と実行結果の表示を担当（InputImagePanel + ResultInspector）。
 * - ProcessNodePopup: ProcessNodeの設定編集用のポップアップUI。
 */
function WorkflowContent({ initialHistoryEntries }: WorkflowContentProps) {
  const {
    nodes,
    edges,
    viewport,
    setNodes,
    setEdges,
    setViewport,
    updateNodeData,
    resetNodeExecutionStatuses,
    updateNodeExecutionStatus,
    updateNodeExecutionResult,
  } = useFlowStore();
  const {
    historyEntries,
    handleSaveSnapshot,
    handleRenameSnapshot,
    handleDeleteSnapshot,
    handleRestoreSnapshot,
  } = useSnapshotHistory(initialHistoryEntries);
  const { selectedNode, handleNodeClick, handlePaneClick, clearSelection } = useSelectedNode(nodes);
  // PROCESSノード以外のクリックを無視する（ポップアップはPROCESSノード専用）
  const handleNodeClickFiltered = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type !== NODE_TYPE.PROCESS) return;
    handleNodeClick(_event, node);
  }, [handleNodeClick]);
  const { showError, showWarning, showSuccess } = useToast();

  // エラーハンドラ
  const handleExecutionError = useCallback((error: unknown) => {
    const appError = categorizeError(error);
    showError(appError);
  }, [showError]);

  // Image Upload & Result State
  const [files, setFiles] = useState<WorkflowFile[]>([]);
  const { executeWorkflow, resultImage, clearResultImage } = useWorkflowExecution({
    nodes,
    edges,
    files,
    resetNodeExecutionStatuses,
    updateNodeExecutionStatus,
    updateNodeExecutionResult,
    onError: handleExecutionError,
  });

  // ========== Node Handlers ==========

  const handleUpdateNode = useCallback((nodeId: string, newData: NodeDataUpdate) => {
    updateNodeData(nodeId, newData);
  }, [updateNodeData]);

  const handleResetCanvas = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    clearSelection();
    setFiles([]);
    clearResultImage();
  }, [setNodes, setEdges, clearSelection, clearResultImage]);

  // ファイルが空になったとき、実行結果もクリアする
  useEffect(() => {
    if (files.length === 0) {
      clearResultImage();
      resetNodeExecutionStatuses();
    }
  }, [files.length, clearResultImage, resetNodeExecutionStatuses]);

  const handleAddNode = useCallback((functionName: ProcessNodeFunctionName) => {
    const newNode: Node<ProcessNodeData> = {
      id: `node-${Date.now()}`,
      type: NODE_TYPE.PROCESS,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: functionName,
        functionName,
        params: DEFAULT_NODE_PARAMS[functionName],
        executionStatus: EXECUTION_STATUS.IDLE,
        icon: DEFAULT_NODE_ICONS[functionName],
      } as ProcessNodeData,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

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

  // JSONインポートハンドラ
  const handleImportSnapshot = useCallback((snapshot: FlowSnapshot) => {
    // Restore workflow to canvas
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setViewport(snapshot.viewport);

    // Auto-save to history with custom name
    const entry = saveFlowSnapshot(snapshot, 'インポートしたワークフロー');
    // Note: historyEntries is managed by useSnapshotHistory hook internally
    // The saved snapshot will appear after page reload, which is acceptable
    // since the workflow is already restored to the canvas

    // Show success toast
    showSuccess('インポート成功', 'ワークフローが正常に復元されました');
  }, [setNodes, setEdges, setViewport, showSuccess]);

  const inspectorValue = useMemo(() => ({
    files,
    setFiles,
    resultImage,
    executeWorkflow,
  }), [files, setFiles, resultImage, executeWorkflow]);

  return (
    <InspectorProvider
      value={inspectorValue}
    >
      <div className={styles.container}>
        <ChatPanel />

        <FlowCanvas
          nodeTypes={nodeTypes}
          defaultViewport={viewport}
          onConnect={onConnect}
          onNodeClick={handleNodeClickFiltered}
          onPaneClick={handlePaneClick}
          onMoveEnd={handleMoveEnd}
          onAddNode={handleAddNode}
          onResetCanvas={handleResetCanvas}
          onSaveSnapshot={handleSaveSnapshot}
          historyEntries={historyEntries}
          onRestoreSnapshot={handleRestoreSnapshot}
          onRenameSnapshot={handleRenameSnapshot}
          onDeleteSnapshot={handleDeleteSnapshot}
          onImportSnapshot={handleImportSnapshot}
        />

        <div className={styles.sidebar}>
          <InputImagePanel />
          <div className={styles.resultSection}>
            <ResultInspector />
          </div>
        </div>

        <ProcessNodePopup
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
          onClose={handlePaneClick}
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
