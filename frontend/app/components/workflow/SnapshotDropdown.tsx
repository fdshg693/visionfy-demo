import type { FlowHistoryEntry } from '@/types/workflowPersistence';
import { useState, useCallback } from 'react';
import { Dropdown } from '@/components/ui/Dropdown';
import { SnapshotListItem } from '@/components/ui/SnapshotListItem';
import { Button } from '@/components/ui/Button';
import { ExportModal } from './ExportModal';

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
 * スナップショット履歴の表示・復元・リネーム・削除・エクスポートを提供します。
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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showExportModal, setShowExportModal] = useState(false);

    // 選択状態をトグル
    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // 全選択/全解除
    const toggleSelectAll = useCallback(() => {
        if (selectedIds.size === historyEntries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(historyEntries.map((e) => e.id)));
        }
    }, [selectedIds.size, historyEntries]);

    // エクスポート実行
    const handleExportClick = useCallback(() => {
        if (selectedIds.size > 0) {
            setShowExportModal(true);
        }
    }, [selectedIds.size]);

    // 選択されたエントリを取得
    const selectedEntries = historyEntries.filter((entry) => selectedIds.has(entry.id));

    if (!isOpen) return null;

    return (
        <>
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
                    {historyEntries.length > 0 && (
                        <div className={styles.snapshotActions}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={toggleSelectAll}
                            >
                                {selectedIds.size === historyEntries.length ? '全解除' : '全選択'}
                            </Button>
                            <Button
                                variant="blue"
                                size="sm"
                                onClick={handleExportClick}
                                disabled={selectedIds.size === 0}
                            >
                                📤 エクスポート ({selectedIds.size})
                            </Button>
                        </div>
                    )}
                </div>
                {historyEntries.length === 0 ? (
                    <p className={styles.snapshotEmpty}>保存されたスナップショットはありません。</p>
                ) : (
                    <ul className={styles.snapshotList}>
                        {historyEntries.map((entry) => (
                            <li key={entry.id} className={styles.snapshotListItemWrapper}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(entry.id)}
                                    onChange={() => toggleSelection(entry.id)}
                                    className={styles.snapshotCheckbox}
                                    aria-label={`${entry.name}を選択`}
                                />
                                <SnapshotListItem
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
                            </li>
                        ))}
                    </ul>
                )}
            </Dropdown>

            {/* エクスポートモーダル */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                selectedEntries={selectedEntries}
            />
        </>
    );
}
