// 役割: 選択ノードの種類に応じてStart/Process/Endの各Inspectorへ切り替える。
// 依存: Start/Process/Endの各Inspectorコンポーネント、NODE_TYPE定数。
import type { NodeDataUpdate } from '@/types/node';
import { NODE_TYPE } from '@/constants/index';
import type { Node } from '@xyflow/react';
import type { ComponentType } from 'react';
import styles from '../NodeInspector.module.css';
import { EndNodeInspector } from '../inspectors/EndNodeInspector';
import { ProcessNodeInspector } from '../inspectors/ProcessNodeInspector';

/**
 * 各Inspectorコンポーネントが受け取る共通Props
 */
interface InspectorComponentProps {
    selectedNode: Node;
    onUpdateNode: (nodeId: string, newData: NodeDataUpdate) => void;
}

/**
 * ノードタイプ → Inspectorコンポーネントのレジストリ
 * 新しいノードタイプを追加する場合は、ここにエントリを追加するだけでよい
 */
const INSPECTOR_REGISTRY: Record<string, ComponentType<InspectorComponentProps>> = {
    [NODE_TYPE.PROCESS]: ProcessNodeInspector as ComponentType<InspectorComponentProps>,
    [NODE_TYPE.END]: EndNodeInspector as ComponentType<InspectorComponentProps>,
};

interface NodeInspectorProps {
    selectedNode: Node | null;
    onUpdateNode: (nodeId: string, newData: NodeDataUpdate) => void;
}

/**
 * ノードインスペクターコンポーネント
 * 選択されたノードの種類に応じて、対応するインスペクターを表示します。
 * @param selectedNode - 現在選択されているノード。選択されていない場合はnull。
 * @param selectedNode.type - ノードの種類 ('startNode' | 'processNode' | 'endNode')。
 * @param onUpdateNode - ノードデータを更新するためのコールバック関数。
 */
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

    const InspectorComponent = selectedNode.type ? INSPECTOR_REGISTRY[selectedNode.type] : undefined;

    if (!InspectorComponent) {
        return (
            <div className={styles.emptyState}>
                未知のノードタイプです: {selectedNode.type}
            </div>
        );
    }

    return (
        <div className={styles.inspector}>
            <h3 className={styles.title}>
                Inspector
            </h3>

            <InspectorComponent
                selectedNode={selectedNode}
                onUpdateNode={onUpdateNode}
            />
        </div>
    );
}
