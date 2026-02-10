import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SnapshotListItem } from '@/components/ui/SnapshotListItem';

import styles from '@/app/page.module.css';
import formStyles from '@/lib/styles/forms.module.css';

type SnapshotPanelProps = {
  historyEntries: FlowHistoryEntry[];
  onSaveSnapshot: () => void;
  onRestoreSnapshot: (entry: FlowHistoryEntry) => void;
  onRenameSnapshot: (entryId: string, name: string) => void;
  onDeleteSnapshot: (entryId: string) => void;
};

/**
 * スナップショットパネルコンポーネント
 * スナップショットの保存と履歴管理を提供します。
 */
export function SnapshotPanel({
  historyEntries,
  onSaveSnapshot,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
}: SnapshotPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  return (
    <div className={styles.snapshotPanel}>
      {/* 保存セクション */}
      <div className={styles.snapshotSavePanel}>
        <p className={styles.snapshotHelp}>現在のフロー状態を保存します。</p>
        <Button variant="primary" size="sm" onClick={onSaveSnapshot}>
          保存する
        </Button>
      </div>

      {/* 履歴セクション */}
      <div className={styles.snapshotHistorySection}>
        <h3 className={styles.snapshotHistoryTitle}>保存履歴</h3>
        {historyEntries.length === 0 ? (
          <p className={styles.snapshotEmpty}>保存されたスナップショットはありません。</p>
        ) : (
          <ul className={styles.snapshotList}>
            {historyEntries.map((entry) => (
              <SnapshotListItem
                key={entry.id}
                entry={entry}
                isEditing={editingId === entry.id}
                draftName={draftName}
                onDraftNameChange={setDraftName}
                onSaveEdit={() => {
                  const trimmed = draftName.trim();
                  if (trimmed) {
                    onRenameSnapshot(entry.id, trimmed);
                  }
                  setEditingId(null);
                  setDraftName('');
                }}
                onCancelEdit={() => {
                  setEditingId(null);
                  setDraftName('');
                }}
                onStartEdit={() => {
                  setEditingId(entry.id);
                  setDraftName(entry.name);
                }}
                onRestore={() => onRestoreSnapshot(entry)}
                onDelete={() => onDeleteSnapshot(entry.id)}
                inputClassName={formStyles['input-field']}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
