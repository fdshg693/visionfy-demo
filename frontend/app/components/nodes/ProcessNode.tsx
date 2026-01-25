import { NodeData } from '@/app/types/node';
import { Handle, Node, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { ChartNoAxesColumn, CheckCircle, Image as ImageIcon, Paintbrush, Palette, Play, Settings } from 'lucide-react';
import { useCallback } from 'react';
import styles from './ProcessNode.module.css';

// Icon mapping
const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
    'histogram': ChartNoAxesColumn,
    'settings': Settings,
    'image': ImageIcon,
    'check': CheckCircle,
    'play': Play,
    'brush': Paintbrush,     // For GaussianBlur
    'palette': Palette,       // For cvtColor
};

export function ProcessNode({ id, data }: NodeProps<Node>) {
    const { setNodes } = useReactFlow();
    // Cast data to our custom NodeData type
    const nodeData = data as unknown as NodeData;
    const status = nodeData.executionStatus || 'idle';
    const params = nodeData.params || {};

    const handleParamChange = useCallback((key: string, value: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    const currentParams = (node.data as unknown as NodeData).params || {};
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            params: {
                                ...currentParams,
                                [key]: value,
                            },
                        },
                    };
                }
                return node;
            })
        );
    }, [id, setNodes]);

    const renderParamInputs = () => {
        if (!params) return null;

        // Special handling for grayscale: enableThreshold + threshold
        if (nodeData.functionName === 'grayscale') {
            const p = params as any;
            const enableThreshold = p.enableThreshold as boolean;
            const threshold = p.threshold as number;
            return (
                <>
                    <div key="enableThreshold" className={styles.paramRow}>
                        <label>threshold</label>
                        <input
                            type="checkbox"
                            checked={enableThreshold}
                            onChange={(e) => handleParamChange('enableThreshold', e.target.checked)}
                            className="nodrag"
                        />
                    </div>
                    {enableThreshold && (
                        <div key="threshold" className={styles.paramRow}>
                            <label>value</label>
                            <input
                                type="number"
                                value={isNaN(threshold) ? '' : threshold}
                                min={0}
                                max={255}
                                onChange={(e) => {
                                    const parsed = parseInt(e.target.value);
                                    handleParamChange('threshold', isNaN(parsed) ? 0 : Math.min(255, Math.max(0, parsed)));
                                }}
                                className="nodrag"
                            />
                        </div>
                    )}
                </>
            );
        }

        return Object.entries(params).map(([key, value]) => {
            const isBoolean = typeof value === 'boolean';
            const isNumber = typeof value === 'number';
            const isArray = Array.isArray(value);

            // Handle boolean as checkbox
            if (isBoolean) {
                return (
                    <div key={key} className={styles.paramRow}>
                        <label>{key}</label>
                        <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleParamChange(key, e.target.checked)}
                            className="nodrag"
                        />
                    </div>
                );
            }

            // Simple handling for numbers
            if (isNumber) {
                return (
                    <div key={key} className={styles.paramRow}>
                        <label>{key}</label>
                        <input
                            type="number"
                            value={isNaN(value as number) ? '' : value as number}
                            onChange={(e) => {
                                const parsed = parseFloat(e.target.value);
                                handleParamChange(key, isNaN(parsed) ? 0 : parsed);
                            }}
                            className="nodrag"
                        />
                    </div>
                );
            } else if (isArray && value.length === 2 && typeof value[0] === 'number') {
                // Handle Tuple [x, y] - split into two inputs
                return (
                    <div key={key} className={styles.paramRow}>
                        <label>{key}</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <input
                                type="number"
                                value={isNaN(value[0]) ? '' : value[0]}
                                onChange={(e) => {
                                    const parsed = parseFloat(e.target.value);
                                    const newVal = [isNaN(parsed) ? 0 : parsed, value[1]];
                                    handleParamChange(key, newVal);
                                }}
                                className="nodrag"
                                style={{ width: '40px' }}
                            />
                            <input
                                type="number"
                                value={isNaN(value[1]) ? '' : value[1]}
                                onChange={(e) => {
                                    const parsed = parseFloat(e.target.value);
                                    const newVal = [value[0], isNaN(parsed) ? 0 : parsed];
                                    handleParamChange(key, newVal);
                                }}
                                className="nodrag"
                                style={{ width: '40px' }}
                            />
                        </div>
                    </div>
                );
            }
            return null;
        });
    };

    const IconComponent = nodeData.icon ? ICON_MAP[nodeData.icon] : null;

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
                {renderParamInputs()}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className={styles.handle}
            />
        </div>
    );
}
