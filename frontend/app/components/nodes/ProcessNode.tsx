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

        return Object.entries(params).map(([key, value]) => {
            const isNumber = typeof value === 'number';
            const isArray = Array.isArray(value);

            // Simple handling for numbers and arrays of numbers (e.g., [5, 5])
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
