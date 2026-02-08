import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { formatSnapshotDate } from '@/lib/formatDate';
import { useState } from 'react';

import styles from '@/app/page.module.css';

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
        <button type="button" onClick={onSaveSnapshot} className={styles.snapshotSaveBtn}>
          保存する
        </button>
      </div>

      {/* 履歴セクション */}
      <div className={styles.snapshotHistorySection}>
        <h3 className={styles.snapshotHistoryTitle}>保存履歴</h3>
        {historyEntries.length === 0 ? (
          <p className={styles.snapshotEmpty}>保存されたスナップショットはありません。</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
