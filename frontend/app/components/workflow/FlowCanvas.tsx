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
import { UsageGuidePanel } from './UsageGuidePanel';
import { SnapshotDropdown } from './SnapshotDropdown';
import type { ProcessNodeFunctionName } from '@/types/node';
import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { VISIONFY_FUNCTIONS_CONFIG } from '@/types/opencv';

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
}: FlowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange } = useFlowStore();
  const { files, executeWorkflow } = useInspector();
  const [showAddNodeMenu, setShowAddNodeMenu] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
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
        <div className={styles.addNodeWrapper}>
          <button
            onClick={() => setShowAddNodeMenu((prev) => !prev)}
            className={styles.addBtn}
          >
            ＋ Add Node
          </button>
          {showAddNodeMenu && (
            <>
              <div className={styles.contextMenuOverlay} onClick={() => setShowAddNodeMenu(false)} />
              <div className={styles.addNodeDropdown}>
                {Object.entries(VISIONFY_FUNCTIONS_CONFIG).map(([name, config]) => (
                  <button
                    key={name}
                    className={styles.addNodeOption}
                    onClick={() => {
                      onAddNode(name as ProcessNodeFunctionName);
                      setShowAddNodeMenu(false);
                    }}
                  >
                    <span className={styles.addNodeOptionName}>{name}</span>
                    <span className={styles.addNodeOptionDesc}>{config.description}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action buttons: Guide, History, Save, Run */}
      <div className={styles.runButtonArea}>
        <UsageGuidePanel />
        <div className={styles.actionButtonWrapper}>
          <button className={styles.addBtn} onClick={() => setShowHistoryDropdown((prev) => !prev)}>
            📋 履歴
          </button>
          <SnapshotDropdown
            isOpen={showHistoryDropdown}
            onClose={() => setShowHistoryDropdown(false)}
            historyEntries={historyEntries}
            onRestoreSnapshot={onRestoreSnapshot}
            onRenameSnapshot={onRenameSnapshot}
            onDeleteSnapshot={onDeleteSnapshot}
          />
        </div>
        <button className={styles.addBtn} onClick={onSaveSnapshot}>💾 保存</button>
        <button className={styles.runButton} onClick={executeWorkflow} disabled={files.length === 0}>▶ Run</button>
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
