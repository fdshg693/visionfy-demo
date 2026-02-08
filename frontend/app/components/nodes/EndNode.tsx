
// 役割: ワークフローの終了ノード表示。入力ハンドルのみを持つ。
// 依存: ReactFlowのHandle/Position。
import { Handle, Position } from '@xyflow/react';
import styles from './ProcessNode.module.css';

export function EndNode() {
    return (
        <div className={`${styles.node} ${styles.endNode}`}>
            <Handle
                type="target"
                position={Position.Left}
                className={styles.handle}
            />

            <div className={styles.label}>
                End
            </div>
        </div>
    );
}
