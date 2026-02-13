// 役割: 処理ノードの見た目とパラメータ入力UIを表示し、入力変更をReactFlow状態に反映する。
// 依存: ProcessNodeHeader、ProcessNodeBody、ProcessNodeHoverPopup、processFunctionBase（カテゴリ情報）
import { useInspector } from '@/contexts/InspectorContext';
import { useObjectURL } from '@/hooks/useObjectURL';
import { useProcessNodeParams } from '@/hooks/useProcessNodeParams';
import type { OpencvParamValue } from '@/types/processFunction';
import { CATEGORY_INFO, PROCESS_FUNCTIONS_BASE, type ProcessNodeCategory } from '@/types/processFunctionBase';
import type { ProcessNodeFunctionName, ProcessNodeParams } from '@/types/processNode';
import { isProcessNodeData } from '@/types/typeGuards';
import { useFlowStore } from '@/workflow/flowStore';
import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import styles from './ProcessNode.module.css';
import { ProcessNodeBody } from './ProcessNodeBody';
import { ProcessNodeHeader } from './ProcessNodeHeader';
import { ProcessNodeHoverPopup } from './ProcessNodeHoverPopup';

/** functionNameからカテゴリ情報を取得 */
function getCategoryForFunction(functionName: string): { category: ProcessNodeCategory; icon: string } | null {
    const def = PROCESS_FUNCTIONS_BASE[functionName as ProcessNodeFunctionName];
    if (!def) return null;
    return { category: def.category, icon: CATEGORY_INFO[def.category].icon };
}

/**
 * 処理ノードコンポーネント。
 * 処理する関数のタイプおよび、それに応じたパラメータ入力UIを表示する。
 */
export function ProcessNode({ id, data: nodeData }: NodeProps<Node>) {
    const { updateNodeData, nodes, edges } = useFlowStore();
    const { files } = useInspector();
    const isValid = isProcessNodeData(nodeData);
    const { params } = useProcessNodeParams(nodeData as import('@/types/processNode').BaseProcessNodeData);
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
    const hasResult = !!nodeData.result;

    // カテゴリ情報を取得
    const categoryInfo = getCategoryForFunction(nodeData.functionName as string);
    const catColors = categoryInfo ? CATEGORY_INFO[categoryInfo.category] : null;

    return (
        <div
            className={`${styles.node} ${styles[status]}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Handle
                type="target"
                position={Position.Left}
                className={styles.handle}
            />

            <ProcessNodeHeader
                icon={nodeData.icon}
                label={nodeData.label}
                status={status}
                headerBg={catColors?.headerBg}
                headerBorder={catColors?.headerBorder}
                iconColor={catColors?.iconColor}
            />

            <ProcessNodeBody
                functionName={nodeData.functionName}
                params={params}
                onParamChange={handleParamChange}
            />

            {/* カテゴリバッジ */}
            {categoryInfo && (
                <div className={styles.categoryBadge}>
                    <span className={styles.categoryIcon}>{categoryInfo.icon}</span>
                    <span>{categoryInfo.category}</span>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Right}
                className={styles.handle}
            />

            {/* Hover popup: shows input/output images when result exists */}
            {hasResult && isHovered && (
                <ProcessNodeHoverPopup
                    inputImage={effectiveInputImage}
                    resultImage={nodeData.result as string}
                />
            )}
        </div>
    );
}

