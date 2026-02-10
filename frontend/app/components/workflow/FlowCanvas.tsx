// 役割: ノード/エッジのキャンバス表示と操作UI(ミニマップ/ズーム/追加ボタン/リセット/右クリック削除)を提供する。
// 依存: ReactFlowのイベントを受け取り、親から渡された状態更新に委譲する。
import { type ComponentProps, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeTypes,
} from '@xyflow/react';
import { useFlowStore } from '@/workflow/flowStore';
import { useContextMenu } from '@/hooks/useContextMenu';
import { useInspector } from '@/contexts/InspectorContext';
import { Button, MenuButton } from '@/components/ui/Button';
import { UsageGuidePanel } from './UsageGuidePanel';
import { SnapshotDropdown } from './SnapshotDropdown';
import { JsonImportModal } from './JsonImportModal';
import { Dropdown } from '@/components/ui/Dropdown';
import type { ProcessNodeFunctionName } from '@/types/processNode';
import type { FlowHistoryEntry, FlowSnapshot } from '@/types/workflowPersistence';
import { VISIONFY_FUNCTIONS_CONFIG } from '@/types/processFunction';

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
}: FlowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange } = useFlowStore();
  const { files, executeWorkflow } = useInspector();
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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
        <Button
          variant="secondary"
          onClick={onResetCanvas}
        >
          ↺ リセット
        </Button>
        <Dropdown
          trigger={(isOpen, toggle) => (
            <Button
              variant="secondary"
              onClick={toggle}
            >
              ＋ ノード追加
            </Button>
          )}
          overlay
          containerClassName={styles.addNodeWrapper}
          className={styles.addNodeDropdown}
          zIndex={100}
          closeOnClickInside
        >
          {Object.entries(VISIONFY_FUNCTIONS_CONFIG).map(([name, config]) => (
            <MenuButton
              key={name}
              withIcon
              onClick={() => onAddNode(name as ProcessNodeFunctionName)}
            >
              <span className={styles.addNodeOptionName}>{name}</span>
              <span className={styles.addNodeOptionDesc}>{config.description}</span>
            </MenuButton>
          ))}
        </Dropdown>
      </div>

      {/* Action buttons: Guide, Import, History, Save, Run */}
      <div className={styles.runButtonArea}>
        <UsageGuidePanel />
        <Button variant="secondary" size="lg" onClick={() => setShowImportModal(true)}>
          📥 JSONインポート
        </Button>
        <div className={styles.actionButtonWrapper}>
          <Button variant="secondary" size="lg" onClick={() => setShowHistoryDropdown((prev) => !prev)}>
            📋 履歴
          </Button>
          <SnapshotDropdown
            isOpen={showHistoryDropdown}
            onClose={() => setShowHistoryDropdown(false)}
            historyEntries={historyEntries}
            onRestoreSnapshot={onRestoreSnapshot}
            onRenameSnapshot={onRenameSnapshot}
            onDeleteSnapshot={onDeleteSnapshot}
          />
        </div>
        <Button variant="secondary" size="lg" onClick={onSaveSnapshot}>💾 保存</Button>
        <Button variant="blue" size="lg" onClick={executeWorkflow} disabled={files.length === 0}>▶ Run</Button>
      </div>

      {/* JSON Import Modal */}
      <JsonImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={onImportSnapshot}
      />

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
  );
}
