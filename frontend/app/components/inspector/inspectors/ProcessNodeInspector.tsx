
import { DEFAULT_NODE_ICONS, DEFAULT_NODE_PARAMS, NodeData } from '@/app/types/node';
import { OPENCV_FUNCTIONS_CONFIG } from '@/app/types/opencv';
import { Node } from '@xyflow/react';
import { useEffect, useState } from 'react';
import styles from '../NodeInspector.module.css';

interface ProcessNodeInspectorProps {
    selectedNode: Node;
    onUpdateNode: (nodeId: string, newData: Partial<NodeData>) => void;
}

export function ProcessNodeInspector({ selectedNode, onUpdateNode }: ProcessNodeInspectorProps) {
    const [functionName, setFunctionName] = useState<string>('');
    const [label, setLabel] = useState('');
    const [params, setParams] = useState<any>({});

    useEffect(() => {
        if (selectedNode) {
            const data = selectedNode.data as unknown as NodeData;
            setFunctionName(data.functionName || '');
            setLabel(data.label || '');
            setParams(data.params || {});
        }
    }, [selectedNode]);

    const handleFunctionChange = (newFunctionName: string) => {
        setFunctionName(newFunctionName);
        const defaultParams = DEFAULT_NODE_PARAMS[newFunctionName as keyof typeof DEFAULT_NODE_PARAMS] || {};
        const defaultIcon = DEFAULT_NODE_ICONS[newFunctionName as keyof typeof DEFAULT_NODE_ICONS] || 'settings';
        setParams(defaultParams);

        onUpdateNode(selectedNode.id, {
            functionName: newFunctionName as any,
            params: defaultParams,
            icon: defaultIcon,
        });
    };

    const handleParamChange = (key: string, value: any) => {
        const updatedParams = { ...params, [key]: value };
        setParams(updatedParams);
        onUpdateNode(selectedNode.id, { params: updatedParams });
    };

    const currentFunctionConfig = OPENCV_FUNCTIONS_CONFIG[functionName];

    return (
        <div className={styles.inspectorContent}>
            {/* Label Input */}
            <div className={styles.field}>
                <label className={styles.label}>Label</label>
                <input
                    type="text"
                    value={label}
                    onChange={(e) => {
                        setLabel(e.target.value);
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
                    {(selectedNode.data as NodeData).result ? (
                        <img
                            src={(selectedNode.data as NodeData).result}
                            alt="Result"
                            className={styles.resultImage}
                        />
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
                    onChange={(e) => handleFunctionChange(e.target.value)}
                    className={styles.select}
                >
                    <option value="" disabled>Select a function</option>
                    {Object.keys(OPENCV_FUNCTIONS_CONFIG).map((func) => (
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
                        {currentFunctionConfig.params.map((param) => (
                            <ParamField
                                key={param.name}
                                config={param}
                                value={params[param.name]}
                                onChange={(value) => handleParamChange(param.name, value)}
                            />
                        ))}
                    </div>
                </div>
            )}


        </div>
    );
}

// Helper components reused from original file (inline here for simplicity or export from elsewhere)
interface ParamFieldProps {
    config: any;
    value: any;
    onChange: (value: any) => void;
}

function ParamField({ config, value, onChange }: ParamFieldProps) {
    const currentValue = value ?? config.defaultValue;

    if (config.type === 'select') {
        return (
            <div className={styles.field}>
                <label className={styles.label}>{config.label || config.name}</label>
                <select
                    value={currentValue}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={styles.select}
                >
                    {config.options?.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    if (config.type === 'tuple') {
        const tupleVal = Array.isArray(currentValue) ? currentValue : [0, 0];
        const handleTupleChange = (index: number, val: string) => {
            const newTuple = [...tupleVal];
            newTuple[index] = Number(val);
            onChange(newTuple);
        };

        return (
            <div className={styles.field}>
                <label className={styles.label}>{config.label || config.name}</label>
                <div className={styles.tupleInput}>
                    <input
                        type="number"
                        value={tupleVal[0]}
                        onChange={(e) => handleTupleChange(0, e.target.value)}
                        className={styles.smallInput}
                        placeholder="x"
                    />
                    <input
                        type="number"
                        value={tupleVal[1]}
                        onChange={(e) => handleTupleChange(1, e.target.value)}
                        className={styles.smallInput}
                        placeholder="y"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.field}>
            <label className={styles.label}>{config.label || config.name}</label>
            <input
                type={config.type === 'number' ? 'number' : 'text'}
                value={currentValue}
                onChange={(e) => onChange(config.type === 'number' ? Number(e.target.value) : e.target.value)}
                className={styles.input}
            />
        </div>
    );
}
