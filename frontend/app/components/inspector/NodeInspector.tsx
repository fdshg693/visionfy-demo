// 役割: 選択ノードの種類に応じてStart/Process/Endの各Inspectorへ切り替える。
// 依存: Start/Process/Endの各Inspectorコンポーネント。
import type { NodeDataUpdate } from '@/types/node';
import { Node } from '@xyflow/react';
import styles from './NodeInspector.module.css';
import { EndNodeInspector } from './inspectors/EndNodeInspector';
import { ProcessNodeInspector } from './inspectors/ProcessNodeInspector';
import { StartNodeInspector } from './inspectors/StartNodeInspector';

interface NodeInspectorProps {
    selectedNode: Node | null;
    onUpdateNode: (nodeId: string, newData: NodeDataUpdate) => void;
}

export function NodeInspector({
    selectedNode,
    onUpdateNode,
}: NodeInspectorProps) {

    if (!selectedNode) {
        return (
            <div className={styles.emptyState}>
                ノードを選択して設定を編集します。
            </div>
        );
    }

    const { type } = selectedNode;

    return (
        <div className={styles.inspector}>
            <h3 className={styles.title}>
                Inspector
            </h3>

            {type === 'startNode' && (
                <StartNodeInspector />
            )}

            {type === 'endNode' && (
                <EndNodeInspector />
            )}

            {type === 'processNode' && (
                <ProcessNodeInspector
                    selectedNode={selectedNode}
                    onUpdateNode={onUpdateNode}
                />
            )}
        </div>
    );
}
