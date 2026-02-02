// 役割: 処理ノードの見た目とパラメータ入力UIを表示し、入力変更をReactFlow状態に反映する。
// 依存: ProcessNodeParamInputsとアイコン定義(processNodeIcons)。
import type { OpencvParamValue } from '@/types/opencv';
import { useFlowStore } from '@/workflow/flowStore';
import { isProcessNodeData } from '@/types/typeGuards';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { useCallback } from 'react';
import { ProcessNodeParamInputs } from './ProcessNodeParamInputs';
import styles from './ProcessNode.module.css';
import { PROCESS_NODE_ICON_MAP } from './processNodeIcons';

/**
 * 処理ノードコンポーネント。
 * 処理する関数のタイプおよび、それに応じたパラメータ入力UIを表示する。
 */
export function ProcessNode({ id, data }: NodeProps<Node>) {
    const { updateNodeData } = useFlowStore();
    const isValid = isProcessNodeData(data);

    const handleParamChange = useCallback((key: string, value: OpencvParamValue) => {
        if (!isValid) {
            return;
        }
        const currentParams = data.params || ({} as Record<string, unknown>);
        updateNodeData(id, {
            params: {
                ...currentParams,
                [key]: value,
            },
        });
    }, [data, id, isValid, updateNodeData]);

    // Type-safe data validation
    if (!isValid) {
        return (
            <div className={styles.node}>
                <div className={styles.header}>
                    <span className={styles.title}>Invalid Node Data</span>
                </div>
            </div>
        );
    }

    const nodeData = data;
    const status = nodeData.executionStatus || 'idle';
    const params = nodeData.params;

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
