import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { formatSnapshotDate } from '@/workflow/formatDate';
import { useState } from 'react';

import styles from '@/app/page.module.css';

type SnapshotHistoryTabProps = {
  historyEntries: FlowHistoryEntry[];
  onRestoreSnapshot: (entry: FlowHistoryEntry) => void;
  onRenameSnapshot: (entryId: string, name: string) => void;
  onDeleteSnapshot: (entryId: string) => void;
};

export function SnapshotHistoryTab({
  historyEntries,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
}: SnapshotHistoryTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  if (historyEntries.length === 0) {
    return <p className={styles.snapshotEmpty}>保存されたスナップショットはありません。</p>;
  }

  return (
    <ul className={styles.snapshotList}>
      {historyEntries.map((entry) => (
        <li key={entry.id}>
          {editingId === entry.id ? (
            <div className={styles.snapshotEditRow}>
              <input
                className={styles.snapshotInput}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="スナップショット名"
              />
              <button
                type="button"
                className={styles.snapshotActionBtn}
                onClick={() => {
                  const trimmed = draftName.trim();
                  if (trimmed) {
                    onRenameSnapshot(entry.id, trimmed);
                  }
                  setEditingId(null);
                  setDraftName('');
                }}
              >
                保存
              </button>
              <button
                type="button"
                className={styles.snapshotSecondaryBtn}
                onClick={() => {
                  setEditingId(null);
                  setDraftName('');
                }}
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className={styles.snapshotRow}>
              <button
                type="button"
                className={styles.snapshotItem}
                onClick={() => onRestoreSnapshot(entry)}
              >
                <span className={styles.snapshotName}>{entry.name}</span>
                <span className={styles.snapshotDate}>{formatSnapshotDate(entry.createdAt)}</span>
              </button>
              <div className={styles.snapshotActions}>
                <button
                  type="button"
                  className={styles.snapshotSecondaryBtn}
                  onClick={() => {
                    setEditingId(entry.id);
                    setDraftName(entry.name);
                  }}
                >
                  編集
                </button>
                <button
                  type="button"
                  className={styles.snapshotDangerBtn}
                  onClick={() => onDeleteSnapshot(entry.id)}
                >
                  削除
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
