import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { useState } from 'react';
import { Dropdown } from '@/components/ui/Dropdown';
import { SnapshotListItem } from '@/components/ui/SnapshotListItem';

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
                            inputClassName={styles.snapshotInput}
                        />
                    ))}
                </ul>
            )}
        </Dropdown>
    );
}
