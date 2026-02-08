// 役割: 処理ノードの見た目とパラメータ入力UIを表示し、入力変更をReactFlow状態に反映する。
// 依存: ProcessNodeParamInputsとアイコン定義(processNodeIcons)。
import { useProcessNodeParams } from '@/hooks/useProcessNodeParams';
import type { ProcessNodeParams } from '@/types/node';
import type { OpencvParamValue } from '@/types/opencv';
import { useFlowStore } from '@/workflow/flowStore';
import { isProcessNodeData } from '@/types/typeGuards';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { useCallback } from 'react';
import { ProcessNodeParamInputs } from './ProcessNodeParamInputs';
import styles from './ProcessNode.module.css';


import { ChartNoAxesColumn, CheckCircle, Image as ImageIcon, Paintbrush, Palette, Play, Settings } from 'lucide-react';
import type { FC } from 'react';

type ProcessNodeIcon = FC<{ size?: number; className?: string }>;

const PROCESS_NODE_ICON_MAP: Record<string, ProcessNodeIcon> = {
    'histogram': ChartNoAxesColumn,
    'settings': Settings,
    'image': ImageIcon,
    'check': CheckCircle,
    'play': Play,
    'brush': Paintbrush,
    'palette': Palette,
};

/**
 * 処理ノードコンポーネント。
 * 処理する関数のタイプおよび、それに応じたパラメータ入力UIを表示する。
 */
export function ProcessNode({ id, data: nodeData }: NodeProps<Node>) {
    const { updateNodeData } = useFlowStore();
    const isValid = isProcessNodeData(nodeData);
    const { params } = useProcessNodeParams(nodeData as import('@/types/node').BaseProcessNodeData);

    // ユーザーのパラメータ入力変更に応じて、ノードデータを更新するハンドラー
    const handleParamChange = useCallback((key: string, value: OpencvParamValue) => {
        if (!isValid) {
            return;
        }
        updateNodeData(id, {
            params: {
                ...params,
                [key]: value,
            } as ProcessNodeParams,
        });
    }, [params, id, isValid, updateNodeData]);

    // 念の為、不正なNodeDataの場合のフォールバック表示
    if (!isValid) {
        return (
            <div className={styles.node}>
                <div className={styles.header}>
                    <span className={styles.title}>Invalid Node Data</span>
                </div>
            </div>
        );
    }

    const status = nodeData.executionStatus || 'idle';

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
