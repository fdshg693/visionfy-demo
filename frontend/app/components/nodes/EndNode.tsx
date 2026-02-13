
// 役割: ワークフローの終了ノード表示。入力ハンドルのみを持つ。
// 依存: ReactFlowのHandle/Position、useZoomLevel。
import { useZoomLevel } from '@/hooks/useZoomLevel';
import { Handle, Position } from '@xyflow/react';
import styles from './ProcessNode.module.css';

export function EndNode() {
    const { lod } = useZoomLevel();
    const isCompact = lod === 'compact';
    const lodClass = isCompact ? styles.compactNode : styles.expandedNode;

    return (
        <div className={`${styles.node} ${styles.endNode} ${lodClass}`}>
            <Handle
                type="target"
                position={Position.Left}
                className={styles.handle}
            />

            <div className={styles.label}>
                <span className={styles.endNodeIcon}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </span>
                {!isCompact && 'Result'}
            </div>
        </div>
    );
}
