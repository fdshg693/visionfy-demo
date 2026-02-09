// 役割: Endノードの結果表示UI。Before/Afterと実行パイプライン履歴をタブで切替表示する。
// 依存: useExecutionHistoryで履歴抽出、useObjectURLでblob URL管理。
import { useState } from 'react';
import styles from '../NodeInspector.module.css';
import { useInspector } from '@/contexts/InspectorContext';
import { useFlowStore } from '@/workflow/flowStore';
import { useObjectURL } from '@/hooks/useObjectURL';
import { useExecutionHistory, type ExecutionHistoryItem } from '@/hooks/useExecutionHistory';

/**
 * パイプラインの矢印と処理ノード名を表示するコンポーネント。
 */
function PipelineArrow({ index, functionName }: { index: number; functionName: string }) {
    return (
        <div className={styles.pipelineArrow}>
            <div className={styles.pipelineArrowLine}>↓</div>
            <div className={styles.pipelineStepLabel}>
                <span className={styles.pipelineStepIndex}>{index + 1}</span>
                <span className={styles.pipelineStepName}>{functionName}</span>
            </div>
            <div className={styles.pipelineArrowLine}>↓</div>
        </div>
    );
}

/**
 * パイプラインの画像を表示するコンポーネント。
 */
function PipelineImage({ src, alt, label }: { src: string; alt: string; label?: string }) {
    return (
        <div className={styles.pipelineImageWrapper}>
            {label && <span className={styles.pipelineImageLabel}>{label}</span>}
            <div className={styles.pipelineImageBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className={styles.resultImage} />
            </div>
        </div>
    );
}

/**
 * ワークフローの終了ノード用インスペクターコンポーネント。
 * Before/Afterと実行パイプライン履歴をタブで切替表示する。
 * - resultタブ：元画像と結果画像の比較表示
 * - historyタブ：元画像から最終画像までの変化を縦に並べて表示
 */
export function EndNodeInspector() {
    const { resultImage, files } = useInspector();
    const { nodes } = useFlowStore();
    const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');
    const originalImage = useObjectURL(files.length > 0 ? files[0].file : null);
    const executionHistory = useExecutionHistory(nodes);

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

            {/* History Tab - Pipeline View */}
            {activeTab === 'history' && (
                <div className={styles.pipelineContainer}>
                    {executionHistory.length === 0 ? (
                        <div className={styles.emptyState}>No execution history</div>
                    ) : (
                        <>
                            {/* Original Image */}
                            {originalImage && (
                                <PipelineImage
                                    src={originalImage}
                                    alt="Original"
                                    label="Original"
                                />
                            )}

                            {/* Pipeline Steps */}
                            {executionHistory.map((item, index) => (
                                <div key={item.nodeId}>
                                    <PipelineArrow
                                        index={index}
                                        functionName={item.functionName}
                                    />
                                    <PipelineImage
                                        src={item.resultImage}
                                        alt={`Step ${index + 1} result`}
                                    />
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
