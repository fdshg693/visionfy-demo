import { NodeData } from '@/app/types/node';
import { Node } from '@xyflow/react';
import styles from './NodeInspector.module.css';
import { EndNodeInspector } from './inspectors/EndNodeInspector';
import { ProcessNodeInspector } from './inspectors/ProcessNodeInspector';
import { StartNodeInspector } from './inspectors/StartNodeInspector';

interface NodeInspectorProps {
    selectedNode: Node | null;
    onUpdateNode: (nodeId: string, newData: Partial<NodeData>) => void;
    // Props for Start Node
    files: any[];
    setFiles: (files: any[]) => void;
    onRun: () => void;
    // Props for End Node
    resultImage: string | null;
}

export function NodeInspector({
    selectedNode,
    onUpdateNode,
    files,
    setFiles,
    onRun,
    resultImage
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
                <StartNodeInspector
                    files={files}
                    setFiles={setFiles}
                    onRun={onRun}
                />
            )}

            {type === 'endNode' && (
                <EndNodeInspector
                    resultImage={resultImage}
                />
            )}

            {type === 'processNode' && (
                <ProcessNodeInspector
                    selectedNode={selectedNode}
                    onUpdateNode={onUpdateNode}
                />
            )}

            {/* Fallback for unknown types or custom backward compatibility */}
            {type === 'custom' && (
                <ProcessNodeInspector
                    selectedNode={selectedNode}
                    onUpdateNode={onUpdateNode}
                />
            )}
        </div>
    );
}
