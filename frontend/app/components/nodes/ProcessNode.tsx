// 役割: 処理ノードの見た目とパラメータ入力UIを表示し、入力変更をReactFlow状態に反映する。
// 依存: ProcessNodeParamInputsとアイコン定義(processNodeIcons)。
import { useProcessNodeParams } from '@/hooks/useProcessNodeParams';
import type { ProcessNodeParams } from '@/types/node';
import type { OpencvParamValue } from '@/types/opencv';
import { useFlowStore } from '@/workflow/flowStore';
import { isProcessNodeData } from '@/types/typeGuards';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { useCallback, useState, useMemo } from 'react';
import { ProcessNodeParamInputs } from './ProcessNodeParamInputs';
import { useInspector } from '@/contexts/InspectorContext';
import { useObjectURL } from '@/hooks/useObjectURL';
import styles from './ProcessNode.module.css';

/** 関数タイプに応じた背景色CSSクラスのマッピング */
const FUNCTION_TYPE_CLASS_MAP: Record<string, string> = {
    'createclahe': styles['fn-createclahe'],
    'gaussianblur': styles['fn-gaussianblur'],
    'grayscale': styles['fn-grayscale'],
    'remove_noise': styles['fn-remove_noise'],
    'restore_brightness': styles['fn-restore_brightness'],
    'restore_contrast': styles['fn-restore_contrast'],
};

import { ChartNoAxesColumn, CheckCircle, Image as ImageIcon, Paintbrush, Palette, Play, Settings } from 'lucide-react';
import type { FC } from 'react';

type ProcessNodeIcon = FC<{ size?: number; className?: string }>;

const PROCESS_NODE_ICON_MAP: Record<string, ProcessNodeIcon> = {
    'histogram': ChartNoAxesColumn,
    'settings': Settings,
    'image': ImageIcon,
    'check': CheckCircle,
    'play': Play,
    'brush': Paintbrush,
    'palette': Palette,
};

/**
 * 処理ノードコンポーネント。
 * 処理する関数のタイプおよび、それに応じたパラメータ入力UIを表示する。
 */
export function ProcessNode({ id, data: nodeData }: NodeProps<Node>) {
    const { updateNodeData, nodes, edges } = useFlowStore();
    const { files } = useInspector();
    const isValid = isProcessNodeData(nodeData);
    const { params } = useProcessNodeParams(nodeData as import('@/types/node').BaseProcessNodeData);
    const [isHovered, setIsHovered] = useState(false);

    // 入力画像を取得: 前のprocessノードのresult、なければnull
    const inputImage = useMemo(() => {
        const incomingEdge = edges.find(e => e.target === id);
        if (!incomingEdge) return null;

        const sourceNode = nodes.find(n => n.id === incomingEdge.source);
        if (!sourceNode) return null;

        if (sourceNode.type === 'processNode' && isProcessNodeData(sourceNode.data) && sourceNode.data.result) {
            return sourceNode.data.result as string;
        }

        return null;
    }, [id, nodes, edges]);

    // 元画像のURL (startNodeからの入力の場合)
    const originalFile = files.length > 0 ? files[0].file : null;
    const originalImageURL = useObjectURL(originalFile);

    // 最終的な入力画像（前のノードのresult or アップロード画像）
    const effectiveInputImage = inputImage || originalImageURL;

    // ユーザーのパラメータ入力変更に応じて、ノードデータを更新するハンドラー
    const handleParamChange = useCallback((key: string, value: OpencvParamValue) => {
        if (!isValid) {
            return;
        }
        updateNodeData(id, {
            params: {
                ...params,
                [key]: value,
            } as ProcessNodeParams,
        });
    }, [params, id, isValid, updateNodeData]);

    // 念の為、不正なNodeDataの場合のフォールバック表示
    if (!isValid) {
        return (
            <div className={styles.node}>
                <div className={styles.header}>
                    <span className={styles.title}>Invalid Node Data</span>
                </div>
            </div>
        );
    }

    const status = nodeData.executionStatus || 'idle';

    const IconComponent = nodeData.icon ? PROCESS_NODE_ICON_MAP[nodeData.icon] : null;
    const hasResult = !!nodeData.result;

    return (
        <div
            className={`${styles.node} ${styles[status]} ${FUNCTION_TYPE_CLASS_MAP[nodeData.functionName as string] || ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
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
                <span className={styles.title}>{nodeData.label || 'Process'}</span>
            </div>

            <div className={styles.body}>
                <ProcessNodeParamInputs
                    functionName={nodeData.functionName}
                    params={params}
                    onParamChange={handleParamChange}
                />
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className={styles.handle}
            />

            {/* Hover popup: shows input/output images when result exists */}
            {hasResult && isHovered && (
                <div className={styles.hoverPopup}>
                    <div className={styles.hoverPopupImages}>
                        <div className={styles.hoverPopupImageWrapper}>
                            <span className={styles.hoverPopupLabel}>Input</span>
                            <div className={styles.hoverPopupImageBox}>
                                {effectiveInputImage ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={effectiveInputImage} alt="Input" className={styles.hoverPopupImage} />
                                ) : (
                                    <span className={styles.hoverPopupEmpty}>No input</span>
                                )}
                            </div>
                        </div>
                        <div className={styles.hoverPopupArrow}>→</div>
                        <div className={styles.hoverPopupImageWrapper}>
                            <span className={styles.hoverPopupLabel}>Output</span>
                            <div className={styles.hoverPopupImageBox}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={nodeData.result as string} alt="Output" className={styles.hoverPopupImage} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
