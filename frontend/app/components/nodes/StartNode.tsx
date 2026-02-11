
// 役割: ワークフローの開始ノード表示。出力ハンドルのみを持つ。
// 依存: ReactFlowのHandle/Position。
import { Handle, Position } from '@xyflow/react';
import styles from './ProcessNode.module.css'; // Reusing for consistent look or can separate

export function StartNode() {
    return (
        <div className={`${styles.node} ${styles.startNode}`}>
            <div className={styles.label}>
                開始
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className={styles.handle}
            />
        </div>
    );
}
