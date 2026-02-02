import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { useState } from 'react';

import styles from '@/app/page.module.css';
import { SnapshotHistoryTab } from '@/app/components/workflow/SnapshotHistoryTab';
import { SnapshotSaveTab } from '@/app/components/workflow/SnapshotSaveTab';

type SnapshotPanelProps = {
  historyEntries: FlowHistoryEntry[];
  onSaveSnapshot: () => void;
  onRestoreSnapshot: (entry: FlowHistoryEntry) => void;
  onRenameSnapshot: (entryId: string, name: string) => void;
  onDeleteSnapshot: (entryId: string) => void;
};

export function SnapshotPanel({
  historyEntries,
  onSaveSnapshot,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
}: SnapshotPanelProps) {
  const [activeTab, setActiveTab] = useState<'save' | 'history'>('save');

  return (
    <div className={styles.snapshotPanel}>
      <div className={styles.snapshotTabs}>
        <button
          type="button"
          className={activeTab === 'save' ? styles.snapshotTabActive : styles.snapshotTab}
          onClick={() => setActiveTab('save')}
        >
          保存
        </button>
        <button
          type="button"
          className={activeTab === 'history' ? styles.snapshotTabActive : styles.snapshotTab}
          onClick={() => setActiveTab('history')}
        >
          履歴
        </button>
      </div>

      {activeTab === 'save' ? (
        <SnapshotSaveTab onSave={onSaveSnapshot} />
      ) : (
        <SnapshotHistoryTab
          historyEntries={historyEntries}
          onRestoreSnapshot={onRestoreSnapshot}
          onRenameSnapshot={onRenameSnapshot}
          onDeleteSnapshot={onDeleteSnapshot}
        />
      )}
    </div>
  );
}
