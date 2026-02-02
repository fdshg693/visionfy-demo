import styles from '@/app/page.module.css';

type SnapshotSaveTabProps = {
  onSave: () => void;
};

export function SnapshotSaveTab({ onSave }: SnapshotSaveTabProps) {
  return (
    <div className={styles.snapshotSavePanel}>
      <p className={styles.snapshotHelp}>現在のフロー状態を保存します。</p>
      <button type="button" onClick={onSave} className={styles.snapshotSaveBtn}>
        保存する
      </button>
    </div>
  );
}
