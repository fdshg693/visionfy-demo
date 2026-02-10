import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { formatSnapshotDate } from '@/lib/formatDate';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

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
              <li key={entry.id}>
                {editingId === entry.id ? (
                  <div className={styles.snapshotEditRow}>
                    <FormField
                      name="snapshotName"
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      placeholder="スナップショット名"
                      inputClassName={formStyles['input-field']}
                    />
                    <Button
                      variant="primary"
                      size="sm"
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
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingId(null);
                        setDraftName('');
                      }}
                    >
                      キャンセル
                    </Button>
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingId(entry.id);
                          setDraftName(entry.name);
                        }}
                      >
                        編集
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDeleteSnapshot(entry.id)}
                      >
                        削除
                      </Button>
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
