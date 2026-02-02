// 役割: 処理ノードの見た目とパラメータ入力UIを表示し、入力変更をReactFlow状態に反映する。
// 依存: ProcessNodeParamInputsとアイコン定義(processNodeIcons)。
import type { OpencvParamValue } from '@/types/opencv';
import { useFlowStore } from '@/workflow/flowStore';
import { type ProcessNodeData, type ProcessNodeParams } from '@/types/node';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { useCallback } from 'react';
import { ProcessNodeParamInputs } from './ProcessNodeParamInputs';
import styles from './ProcessNode.module.css';
import { PROCESS_NODE_ICON_MAP } from './processNodeIcons';

export function ProcessNode({ id, data }: NodeProps<Node>) {
    const { updateNodeData } = useFlowStore();
    // Cast data to our NodeData type
    const nodeData = data as unknown as ProcessNodeData;
    const status = nodeData.executionStatus || 'idle';
    const params = (nodeData.params || {}) as ProcessNodeParams;

    const handleParamChange = useCallback((key: string, value: OpencvParamValue) => {
        const currentParams = (nodeData.params || {}) as Record<string, unknown>;
        updateNodeData(id, {
            params: {
                ...currentParams,
                [key]: value,
            },
        });
    }, [id, nodeData.params, updateNodeData]);

    const IconComponent = nodeData.icon ? PROCESS_NODE_ICON_MAP[nodeData.icon] : null;

    return (
        <div className={`${styles.node} ${styles[status]}`}>
            <Handle
                type="target"
                position={Position.Left}
                className={styles.handle}
            />

            <div className={styles.header}>
                {/* Dynamic Icon */}
                {IconComponent && (
                    <IconComponent size={16} className={styles.icon} />
                )}
                {/* Use functionName as the main label */}
                <span className={styles.title}>{nodeData.functionName || 'Process'}</span>
            </div>

            <div className={styles.body}>
                <ProcessNodeParamInputs
                    functionName={nodeData.functionName}
                    params={params}
                    onParamChange={handleParamChange}
                />
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className={styles.handle}
            />
        </div>
    );
}
