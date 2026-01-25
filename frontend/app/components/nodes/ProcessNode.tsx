import { NodeData } from '@/app/types/node';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import styles from './ProcessNode.module.css';

export function ProcessNode({ data }: NodeProps<Node>) {
    // Cast data to our custom NodeData type
    const nodeData = data as unknown as NodeData;
    const status = nodeData.executionStatus || 'idle';

    return (
        <div className={`${styles.node} ${styles[status]}`}>
            <Handle
                type="target"
                position={Position.Left}
                className={styles.handle}
            />

            <div className={styles.label}>
                {nodeData.label}
            </div>

            <div className={styles.functionName}>
                {nodeData.functionName || '(no function)'}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className={styles.handle}
            />
        </div>
    );
}
