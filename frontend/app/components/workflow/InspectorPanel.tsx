// 役割: 右側インスペクタの枠。選択ノードの詳細UIをNodeInspectorへ集約して渡す。
// 依存: NodeInspectorに実行/画像/ノード情報を橋渡しする。
import { InputImagePanel } from '@/app/components/workflow/InputImagePanel';
import { NodeInspector } from '@/app/components/workflow/NodeInspector';
import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import type { NodeDataUpdate } from '@/types/node';
import type { Node } from '@xyflow/react';

import styles from '@/app/page.module.css';
import { SnapshotPanel } from '@/app/components/workflow/SnapshotPanel';

type InspectorPanelProps = {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, newData: NodeDataUpdate) => void;
  historyEntries: FlowHistoryEntry[];
  onSaveSnapshot: () => void;
  onRestoreSnapshot: (entry: FlowHistoryEntry) => void;
  onRenameSnapshot: (entryId: string, name: string) => void;
  onDeleteSnapshot: (entryId: string) => void;
  activeTab: 'inspector' | 'snapshot';
  onChangeTab: (tab: 'inspector' | 'snapshot') => void;
};

/**
 * インスペクタパネルコンポーネント
 * ノードの詳細設定とスナップショット管理のタブを提供します。
 * - SnapshotPanel: スナップショットの保存/復元/管理UIを提供
 * - NodeInspector: 選択ノードの詳細設定UIを提供
 */
export function InspectorPanel({
  selectedNode,
  onUpdateNode,
  historyEntries,
  onSaveSnapshot,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  activeTab,
  onChangeTab,
}: InspectorPanelProps) {
  return (
    <div className={styles.sidebar}>
      <InputImagePanel />

      <div className={styles.sidebarTabs}>
        <button
          type="button"
          className={
            activeTab === 'inspector' ? styles.sidebarTabActive : styles.sidebarTab
          }
          onClick={() => onChangeTab('inspector')}
        >
          Inspector
        </button>
        <button
          type="button"
          className={
            activeTab === 'snapshot' ? styles.sidebarTabActive : styles.sidebarTab
          }
          onClick={() => onChangeTab('snapshot')}
        >
          保存
        </button>
      </div>

      {activeTab === 'snapshot' ? (
        <SnapshotPanel
          historyEntries={historyEntries}
          onSaveSnapshot={onSaveSnapshot}
          onRestoreSnapshot={onRestoreSnapshot}
          onRenameSnapshot={onRenameSnapshot}
          onDeleteSnapshot={onDeleteSnapshot}
        />
      ) : (
        <NodeInspector
          selectedNode={selectedNode}
          onUpdateNode={onUpdateNode}
        />
      )}
    </div>
  );
}
