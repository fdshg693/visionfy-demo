import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { formatSnapshotDate } from '@/lib/formatDate';
import { useState } from 'react';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

import styles from '@/app/page.module.css';

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
        <Dropdown
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            trigger={() => null}
            overlay
            position="bottom-right"
            className={styles.snapshotDropdown}
            zIndex={100}
        >
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
                                    <FormField
                                        name="snapshotName"
                                        value={draftName}
                                        onChange={(event) => setDraftName(event.target.value)}
                                        placeholder="スナップショット名"
                                        inputClassName={styles.snapshotInput}
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
        </Dropdown>
    );
}
