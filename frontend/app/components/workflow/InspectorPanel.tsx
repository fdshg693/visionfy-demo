import { InputImagePanel } from '@/app/components/workflow/InputImagePanel';
import { ResultInspector } from '@/app/components/inspectors/EndNodeInspector';
import styles from '@/app/page.module.css';

/**
 * サイドバーパネル
 * 入力画像の表示と、実行結果(Result/History)を常時表示する。
 * ※ ProcessNodeインスペクターはポップアップに、保存機能はキャンバス上に移動済み。
 */
export function InspectorPanel() {
  return (
    <div className={styles.sidebar}>
      <InputImagePanel />
      <div className={styles.resultSection}>
        <ResultInspector />
      </div>
    </div>
  );
}
