// 役割: ノード/エッジのキャンバス表示と操作UI(ミニマップ/ズーム/追加ボタン/リセット/右クリック削除)を提供する。
// 依存: ReactFlowのイベントを受け取り、親から渡された状態更新に委譲する。
import { MenuButton } from '@/components/ui/Button';
import { useInspector } from '@/contexts/InspectorContext';
import { useContextMenu } from '@/hooks/useContextMenu';
import type { ProcessNodeFunctionName } from '@/types/processNode';
import type { FlowHistoryEntry, FlowSnapshot } from '@/types/workflowPersistence';
import { useFlowStore } from '@/workflow/flowStore';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeTypes,
} from '@xyflow/react';
import { useState, type ComponentProps } from 'react';
import { WorkflowHeader } from '../layout/WorkflowHeader';
import { GenerateCodeModal } from './GenerateCodeModal';
import { ImagePreviewOverlay } from './ImagePreviewOverlay';
import { JsonImportModal } from './JsonImportModal';

import styles from '@/app/page.module.css';

type FlowCanvasProps = {
  nodeTypes: NodeTypes;
  defaultViewport?: ComponentProps<typeof ReactFlow>['defaultViewport'];
  onConnect: ComponentProps<typeof ReactFlow>['onConnect'];
  onNodeClick: ComponentProps<typeof ReactFlow>['onNodeClick'];
  onPaneClick: ComponentProps<typeof ReactFlow>['onPaneClick'];
  onMoveEnd?: ComponentProps<typeof ReactFlow>['onMoveEnd'];
  onAddNode: (functionName: ProcessNodeFunctionName) => void;
  onResetCanvas: () => void;
  onSaveSnapshot: () => void;
  historyEntries: FlowHistoryEntry[];
  onRestoreSnapshot: (entry: FlowHistoryEntry) => void;
  onRenameSnapshot: (entryId: string, name: string) => void;
  onDeleteSnapshot: (entryId: string) => void;
  onImportSnapshot: (snapshot: FlowSnapshot) => void;
  onToggleInspector: () => void;
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
  onSaveSnapshot,
  historyEntries,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  onImportSnapshot,
  onToggleInspector,
}: FlowCanvasProps) {
  const { nodes, edges, viewport, onNodesChange, onEdgesChange } = useFlowStore();
  const { files, executeWorkflow } = useInspector();
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGenerateCodeModal, setShowGenerateCodeModal] = useState(false);
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
      <WorkflowHeader
        onAddNode={onAddNode}
        onResetCanvas={onResetCanvas}
        onSaveSnapshot={onSaveSnapshot}
        onRunWorkflow={executeWorkflow}
        onImportClick={() => setShowImportModal(true)}
        onGenerateCodeClick={() => setShowGenerateCodeModal(true)}
        onHistoryClick={() => setShowHistoryDropdown((prev) => !prev)}
        showHistoryDropdown={showHistoryDropdown}
        setShowHistoryDropdown={setShowHistoryDropdown}
        historyEntries={historyEntries}
        onRestoreSnapshot={onRestoreSnapshot}
        onRenameSnapshot={onRenameSnapshot}
        onDeleteSnapshot={onDeleteSnapshot}
        canRun={files.length > 0}
        hasNodes={nodes.filter(n => n.type === 'processNode').length > 0}
      />

      <div className={styles.flowWrapper}>
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
          connectionRadius={50}
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

        <ImagePreviewOverlay onToggleInspector={onToggleInspector} />

        {contextMenu && (
          <>
            <div className={styles.contextMenuOverlay} onClick={closeContextMenu} />
            <div
              className={styles.contextMenu}
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <MenuButton danger onClick={handleDelete}>
                削除
              </MenuButton>
            </div>
          </>
        )}
      </div>

      {/* JSON Import Modal */}
      <JsonImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={onImportSnapshot}
      />

      {/* Generate Code Modal */}
      <GenerateCodeModal
        isOpen={showGenerateCodeModal}
        onClose={() => setShowGenerateCodeModal(false)}
        nodes={nodes}
        edges={edges}
        viewport={viewport}
      />
    </div>
  );
}
