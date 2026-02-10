import { ProcessNodeInspector } from '@/app/components/inspectors/ProcessNodeInspector';
import { NODE_TYPE } from '@/constants/index';
import type { NodeDataUpdate } from '@/types/node';
import type { Node } from '@xyflow/react';
import { Modal } from '@/components/ui/Modal';

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
        <Modal
            isOpen={!!selectedNode}
            onClose={onClose}
            title="Inspector"
        >
            <ProcessNodeInspector selectedNode={selectedNode} onUpdateNode={onUpdateNode} />
        </Modal>
    );
}
