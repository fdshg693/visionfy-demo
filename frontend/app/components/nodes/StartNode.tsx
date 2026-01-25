
import { Handle, Position } from '@xyflow/react';
import styles from './ProcessNode.module.css'; // Reusing for consistent look or can separate

export function StartNode() {
    return (
        <div className={`${styles.node} ${styles.startNode}`}>
            <div className={styles.label}>
                Start
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className={styles.handle}
            />
        </div>
    );
}
