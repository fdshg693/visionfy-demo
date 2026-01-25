import { Node } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import styles from '../NodeInspector.module.css';

interface ExecutionHistoryItem {
    nodeId: string;
    functionName: string;
    params: Record<string, unknown>;
    resultImage: string;
}

interface EndNodeInspectorProps {
    resultImage: string | null;
    files: any[];
    nodes: Node[];
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

export function EndNodeInspector({ resultImage, files, nodes }: EndNodeInspectorProps) {
    const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');

    const originalImage = files.length > 0 ? (URL.createObjectURL(files[0].file) as string) : null;

    // Extract execution history from process nodes
    const executionHistory: ExecutionHistoryItem[] = nodes
        .filter(n => n.type === 'processNode' || n.type === 'custom')
        .filter(n => n.data.result) // Only nodes with results
        .map(n => ({
            nodeId: n.id,
            functionName: n.data.functionName as string,
            params: n.data.resultParams as Record<string, unknown> || {},
            resultImage: n.data.result as string,
        }));

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
                                    <img src={originalImage} alt="Original" className={styles.resultImage} />
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
                                    <img src={resultImage} alt="Result" className={styles.resultImage} />
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
