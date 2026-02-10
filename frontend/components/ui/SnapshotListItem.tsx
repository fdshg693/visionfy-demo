import type { FlowHistoryEntry } from '@/workflow/flowPersistence';
import { formatSnapshotDate } from '@/lib/formatDate';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

import styles from '@/app/page.module.css';

type SnapshotListItemProps = {
  entry: FlowHistoryEntry;
  isEditing: boolean;
  draftName: string;
  onDraftNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onRestore: () => void;
  onDelete: () => void;
  inputClassName?: string;
};

/**
 * スナップショットリストアイテムコンポーネント
 * SnapshotPanelとSnapshotDropdownで共有される単一のスナップショットエントリ表示・編集UI
 */
export function SnapshotListItem({
  entry,
  isEditing,
  draftName,
  onDraftNameChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onRestore,
  onDelete,
  inputClassName,
}: SnapshotListItemProps) {
  return (
    <li>
      {isEditing ? (
        <div className={styles.snapshotEditRow}>
          <FormField
            name="snapshotName"
            value={draftName}
            onChange={(event) => onDraftNameChange(event.target.value)}
            placeholder="スナップショット名"
            inputClassName={inputClassName}
          />
          <Button variant="primary" size="sm" onClick={onSaveEdit}>
            保存
          </Button>
          <Button variant="secondary" size="sm" onClick={onCancelEdit}>
            キャンセル
          </Button>
        </div>
      ) : (
        <div className={styles.snapshotRow}>
          <button type="button" className={styles.snapshotItem} onClick={onRestore}>
            <span className={styles.snapshotName}>{entry.name}</span>
            <span className={styles.snapshotDate}>{formatSnapshotDate(entry.createdAt)}</span>
          </button>
          <div className={styles.snapshotActions}>
            <Button variant="secondary" size="sm" onClick={onStartEdit}>
              編集
            </Button>
            <Button variant="danger" size="sm" onClick={onDelete}>
              削除
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
