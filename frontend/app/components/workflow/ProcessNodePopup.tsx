import { ProcessNodeInspector } from '@/app/components/inspectors/ProcessNodeInspector';
import { NODE_TYPE } from '@/constants/index';
import type { NodeDataUpdate } from '@/types/node';
import type { Node } from '@xyflow/react';
import { IconButton } from '@/components/ui/Button';
import styles from './ProcessNodePopup.module.css';

type ProcessNodePopupProps = {
    selectedNode: Node | null;
    onUpdateNode: (nodeId: string, newData: NodeDataUpdate) => void;
    onClose: () => void;
};

export function ProcessNodePopup({ selectedNode, onUpdateNode, onClose }: ProcessNodePopupProps) {
    if (!selectedNode || selectedNode.type !== NODE_TYPE.PROCESS) {
        return null;
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                <div className={styles.popupHeader}>
                    <h3 className={styles.popupTitle}>Inspector</h3>
                    <IconButton size="sm" onClick={onClose} aria-label="閉じる">✕</IconButton>
                </div>
                <div className={styles.popupBody}>
                    <ProcessNodeInspector selectedNode={selectedNode} onUpdateNode={onUpdateNode} />
                </div>
            </div>
        </div>
    );
}
