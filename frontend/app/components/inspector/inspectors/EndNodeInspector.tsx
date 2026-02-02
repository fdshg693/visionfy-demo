// 役割: Endノードの結果表示UI。Before/Afterと実行履歴をタブで切替表示する。
// 依存: nodesから履歴を抽出し、CollapsibleHistoryItemで展開表示。
import type { Node } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ProcessNodeData, ProcessNodeFunctionName, ProcessNodeParams } from '@/types/node';
import { isProcessNodeData } from '@/types/typeGuards';
import styles from '../NodeInspector.module.css';
import { useInspector } from '@/contexts/InspectorContext';

interface ExecutionHistoryItem {
    nodeId: string;
    functionName: ProcessNodeFunctionName;
    params: ProcessNodeParams;
    resultImage: string;
}

// Collapsible history item component
function CollapsibleHistoryItem({ item, index }: { item: ExecutionHistoryItem; index: number }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.historyItem}>
            <button
                className={styles.historyHeader}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={styles.historyHeaderLeft}>
                    <span className={styles.historyIndex}>{index + 1}</span>
                    <span className={styles.historyFunctionName}>{item.functionName}</span>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isOpen && (
                <div className={styles.historyContent}>
                    <div className={styles.historyImageBox}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.resultImage} alt={`Step ${index + 1}`} className={styles.resultImage} />
                    </div>
                    <div className={styles.historyParams}>
                        <pre>{JSON.stringify(item.params, null, 2)}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

export function EndNodeInspector() {
    const { resultImage, files, nodes } = useInspector();
    const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');

    const originalImage = files.length > 0 ? (URL.createObjectURL(files[0].file) as string) : null;

    // Extract execution history from process nodes with type-safe validation
    const executionHistory = nodes
        .filter((node) => node.type === 'processNode')
        .map((node) => {
            // Validate node data structure
            if (!isProcessNodeData(node.data)) return null;

            const data = node.data;
            if (!data.result) return null;

            return {
                nodeId: node.id,
                functionName: data.functionName,
                params: (data.resultParams as ProcessNodeParams) || data.params,
                resultImage: data.result,
            };
        })
        .filter((item): item is ExecutionHistoryItem => item !== null);

    return (
        <div className={styles.inspectorContent}>
            {/* Tab Headers */}
            <div className={styles.tabHeader}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'result' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('result')}
                >
                    Result
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'history' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
            </div>

            {/* Result Tab */}
            {activeTab === 'result' && (
                <div className={styles.field}>
                    <label className={styles.label}>Before / After</label>
                    <div className={styles.comparisonContainer}>
                        <div className={styles.imageWrapper}>
                            <span className={styles.imageLabel}>Before</span>
                            <div className={styles.imageBox}>
                                {originalImage ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={originalImage} alt="Original" className={styles.resultImage} />
                                    </>
                                ) : (
                                    <div className={styles.emptyResult}>None</div>
                                )}
                            </div>
                        </div>
                        <div className={styles.arrow}>↓</div>
                        <div className={styles.imageWrapper}>
                            <span className={styles.imageLabel}>After</span>
                            <div className={styles.imageBox}>
                                {resultImage ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={resultImage} alt="Result" className={styles.resultImage} />
                                    </>
                                ) : (
                                    <div className={styles.emptyResult}>No result</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className={styles.historyContainer}>
                    {executionHistory.length === 0 ? (
                        <div className={styles.emptyState}>No execution history</div>
                    ) : (
                        executionHistory.map((item, index) => (
                            <CollapsibleHistoryItem key={item.nodeId} item={item} index={index} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
