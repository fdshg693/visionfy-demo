// 役割: ノードクリックで表示されるスライドインサイドパネル。
// Start/Endノード → InputImagePanel + ResultInspector、ProcessNode → ProcessNodeInspector を表示。
// 依存: InspectorContext経由で画像状態を取得。
'use client';

import { InputImagePanel } from '@/app/components/workflow/InputImagePanel';
import { NODE_TYPE } from '@/constants/index';
import type { NodeDataUpdate } from '@/types/processNode';
import type { Node } from '@xyflow/react';
import styles from './InspectorSidePanel.module.css';
import { ProcessNodeInspector } from './ProcessNodeInspector';
import { ResultInspector } from './ResultNodeInspector';

type InspectorSidePanelProps = {
    isOpen: boolean;
    onClose: () => void;
    selectedNode: Node | null;
    onUpdateNode: (nodeId: string, newData: NodeDataUpdate) => void;
};

/**
 * 右からスライドインするインスペクターサイドパネル。
 * ノードクリックで表示され、選択ノードに応じた内容を表示する。
 */
export function InspectorSidePanel({ isOpen, onClose, selectedNode, onUpdateNode }: InspectorSidePanelProps) {
    const isProcessNode = selectedNode?.type === NODE_TYPE.PROCESS;

    // パネルタイトルをノードタイプに応じて変更
    const panelTitle = isProcessNode
        ? `⚙️ ${(selectedNode?.data?.label as string) || 'ノード設定'}`
        : '🔍 インスペクター';

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`${styles.panelOverlay} ${isOpen ? styles.panelOverlayOpen : ''}`}
                onClick={onClose}
            />

            {/* Slide-in panel */}
            <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
                <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>
                        {panelTitle}
                    </h3>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="閉じる"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.panelBody}>
                    {isProcessNode && selectedNode ? (
                        <ProcessNodeInspector
                            selectedNode={selectedNode}
                            onUpdateNode={onUpdateNode}
                        />
                    ) : (
                        <>
                            <InputImagePanel />
                            <div className={styles.resultSection}>
                                <ResultInspector />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
