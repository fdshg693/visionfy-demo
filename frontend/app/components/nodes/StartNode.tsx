
// 役割: ワークフローの開始ノード表示。出力ハンドルのみを持つ。
// 依存: ReactFlowのHandle/Position、useZoomLevel。
import { useZoomLevel } from '@/hooks/useZoomLevel';
import { Handle, Position } from '@xyflow/react';
import styles from './ProcessNode.module.css';

export function StartNode() {
    const { lod } = useZoomLevel();
    const isCompact = lod === 'compact';
    const lodClass = isCompact ? styles.compactNode : styles.expandedNode;

    return (
        <div className={`${styles.node} ${styles.startNode} ${lodClass}`}>
            <div className={styles.label}>
                <span className={styles.startNodeIcon}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                </span>
                {!isCompact && '入力'}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className={styles.handle}
            />
        </div>
    );
}
