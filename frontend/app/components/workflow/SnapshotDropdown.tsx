import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { formatSnapshotDate } from '@/lib/formatDate';
import { useState } from 'react';

import styles from '@/app/page.module.css';
import buttonStyles from '@/lib/styles/buttons.module.css';

type SnapshotDropdownProps = {
    isOpen: boolean;
    onClose: () => void;
    historyEntries: FlowHistoryEntry[];
    onRestoreSnapshot: (entry: FlowHistoryEntry) => void;
    onRenameSnapshot: (entryId: string, name: string) => void;
    onDeleteSnapshot: (entryId: string) => void;
};

/**
 * スナップショットドロップダウンコンポーネント
 * キャンバスツールバーの「履歴」ボタンから開くドロップダウンパネルで、
 * スナップショット履歴の表示・復元・リネーム・削除を提供します。
 */
export function SnapshotDropdown({
    isOpen,
    onClose,
    historyEntries,
    onRestoreSnapshot,
    onRenameSnapshot,
    onDeleteSnapshot,
}: SnapshotDropdownProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState('');

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.contextMenuOverlay} onClick={onClose} />
            <div className={styles.snapshotDropdown}>
                <div className={styles.snapshotDropdownHeader}>
                    <h3 className={styles.snapshotHistoryTitle}>保存履歴</h3>
                </div>
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
                                            className={buttonStyles['btn-primary-sm']}
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
                                            className={buttonStyles['btn-secondary-sm']}
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
                                                className={buttonStyles['btn-secondary-sm']}
                                                onClick={() => {
                                                    setEditingId(entry.id);
                                                    setDraftName(entry.name);
                                                }}
                                            >
                                                編集
                                            </button>
                                            <button
                                                type="button"
                                                className={buttonStyles['btn-danger-sm']}
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
        </>
    );
}
