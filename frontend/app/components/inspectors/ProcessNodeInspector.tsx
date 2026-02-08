
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
import styles from '../NodeInspector.module.css';

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
            <div className={styles.field}>
                <label className={styles.label}>Label</label>
                <input
                    type="text"
                    value={label}
                    onChange={(e) => {
                        onUpdateNode(selectedNode.id, { label: e.target.value });
                    }}
                    className={styles.input}
                />
            </div>
            {/* Execution Result */}
            <div className={styles.section}>
                <label className={styles.sectionLabel}>
                    Execution Result
                </label>
                <div className={styles.imageBox}>
                    {data.result ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={data.result}
                                alt="Result"
                                className={styles.resultImage}
                            />
                        </>
                    ) : (
                        <div className={styles.emptyResult}>No result</div>
                    )}
                </div>
            </div>

            {/* Function Selection */}
            <div className={styles.field}>
                <label className={styles.label}>Function</label>
                <select
                    value={functionName}
                    onChange={(e) => handleFunctionChange(e.target.value as ProcessNodeFunctionName)}
                    className={styles.select}
                >
                    <option value="" disabled>Select a function</option>
                    {Object.keys(VISIONFY_FUNCTIONS_CONFIG).map((func) => (
                        <option key={func} value={func}>
                            {func}
                        </option>
                    ))}
                </select>
            </div>

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
                                input: styles.input,
                                select: styles.select,
                                tupleInput: styles.tupleInput,
                                smallInput: styles.smallInput,
                            }}
                        />
                    </div>
                </div>
            )}


        </div>
    );
}
