
// 役割: Processノードの詳細設定UI。関数選択/パラメータ編集/結果表示を担う。
// 依存: VISIONFY_FUNCTIONS_CONFIGとNodeDataの定義。
import { ProcessNodeParamInputs } from '@/app/components/nodes/ProcessNodeParamInputs';
import { useProcessNodeParams } from '@/hooks/useProcessNodeParams';
import {
    DEFAULT_NODE_ICONS,
    DEFAULT_NODE_PARAMS,
    type NodeDataUpdate,
    type ProcessNodeFunctionName,
    type ProcessNodeParams,
} from '@/types/node';
import { isProcessNodeData } from '@/types/typeGuards';
import type { OpencvParamValue } from '@/types/opencv';
import { VISIONFY_FUNCTIONS_CONFIG } from '@/types/opencv';
import { Node } from '@xyflow/react';
import { FormField } from '@/components/ui/FormField';
import styles from '../NodeInspector.module.css';
import formStyles from '@/lib/styles/forms.module.css';

interface ProcessNodeInspectorProps {
    selectedNode: Node;
    onUpdateNode: (nodeId: string, newData: NodeDataUpdate) => void;
}

export function ProcessNodeInspector({ selectedNode, onUpdateNode }: ProcessNodeInspectorProps) {
    // Hooks must be called before any early returns (Rules of Hooks)
    const { resolvedFunctionName, params } = useProcessNodeParams(selectedNode.data as import('@/types/node').BaseProcessNodeData);

    // Type-safe data extraction with runtime validation
    if (!isProcessNodeData(selectedNode.data)) {
        return (
            <div className={styles.inspectorContent}>
                <div className={styles.field}>
                    <p>Invalid node data structure</p>
                </div>
            </div>
        );
    }

    const data = selectedNode.data;
    const functionName = (data.functionName as string) || '';
    const label = (data.label as string) || '';

    const handleFunctionChange = (newFunctionName: ProcessNodeFunctionName) => {
        const defaultParams = DEFAULT_NODE_PARAMS[newFunctionName] as ProcessNodeParams;
        const defaultIcon = DEFAULT_NODE_ICONS[newFunctionName] || 'settings';

        onUpdateNode(selectedNode.id, {
            label: newFunctionName,
            functionName: newFunctionName,
            params: defaultParams,
            icon: defaultIcon,
        });
    };

    const handleParamChange = (key: string, value: OpencvParamValue) => {
        const updatedParams = { ...params, [key]: value } as ProcessNodeParams;
        onUpdateNode(selectedNode.id, { params: updatedParams });
    };

    const currentFunctionConfig =
        functionName && VISIONFY_FUNCTIONS_CONFIG[functionName]
            ? VISIONFY_FUNCTIONS_CONFIG[functionName]
            : null;

    return (
        <div className={styles.inspectorContent}>
            {/* Label Input */}
            <FormField
                label="Label"
                name="label"
                value={label}
                onChange={(e) => {
                    onUpdateNode(selectedNode.id, { label: e.target.value });
                }}
                theme="dark"
                className={styles.field}
                labelClassName={styles.label}
                inputClassName={formStyles['input-dark']}
            />

            {/* Function Selection */}
            <FormField
                label="Function"
                type="select"
                name="function"
                value={functionName}
                onChange={(e) => handleFunctionChange(e.target.value as ProcessNodeFunctionName)}
                theme="dark"
                className={styles.field}
                labelClassName={styles.label}
                inputClassName={`${formStyles['input-select']} ${formStyles.dark}`}
            >
                <option value="" disabled>Select a function</option>
                {Object.keys(VISIONFY_FUNCTIONS_CONFIG).map((func) => (
                    <option key={func} value={func}>
                        {func}
                    </option>
                ))}
            </FormField>

            {/* Function Description */}
            {currentFunctionConfig && (
                <div className={styles.description}>
                    {currentFunctionConfig.description}
                </div>
            )}

            {/* Parameters Section */}
            {currentFunctionConfig && (
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>
                        Parameters
                    </label>
                    <div className={styles.paramsList}>
                        <ProcessNodeParamInputs
                            functionName={resolvedFunctionName || undefined}
                            params={params as ProcessNodeParams}
                            onParamChange={handleParamChange}
                            classNames={{
                                field: styles.field,
                                label: styles.label,
                                input: formStyles['input-dark'],
                                select: `${formStyles['input-select']} ${formStyles.dark}`,
                                tupleInput: formStyles['tuple-input'],
                                smallInput: formStyles['input-dark'],
                            }}
                        />
                    </div>
                </div>
            )}


        </div>
    );
}
