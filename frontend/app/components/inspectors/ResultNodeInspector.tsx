// 役割: ワークフロー実行結果の常時表示UI。Before/Afterと実行パイプライン履歴をタブで切替表示する。
// 依存: useExecutionHistoryで履歴抽出、useObjectURLでblob URL管理。
// 備考: InspectorPanelに常時表示され、ENDノードのクリックには依存しない。
import { useState } from 'react';
import styles from '../NodeInspector.module.css';
import { useInspector } from '@/contexts/InspectorContext';
import { useFlowStore } from '@/workflow/flowStore';
import { useObjectURL } from '@/hooks/useObjectURL';
import { useExecutionHistory, type ExecutionHistoryItem } from '@/hooks/useExecutionHistory';
import { ImageBox } from '@/components/ui/ImageBox';
import { TabGroup, TabPanel } from '@/components/ui/TabGroup';

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
            <ImageBox
                src={src}
                alt={alt}
                aspectRatio={1}
                theme="dark"
                className={styles.pipelineImageBox}
                imgClassName={styles.resultImage}
            />
        </div>
    );
}

/**
 * ワークフロー実行結果の常時表示コンポーネント。
 * Before/Afterと実行パイプライン履歴をタブで切替表示する。
 * - resultタブ：元画像と結果画像の比較表示
 * - historyタブ：元画像から最終画像までの変化を縦に並べて表示
 * 
 * InspectorPanelに常時マウントされ、ENDノードのクリックには依存しない。
 */
export function ResultInspector() {
    const { resultImage, files } = useInspector();
    const { nodes } = useFlowStore();
    const [activeTab, setActiveTab] = useState<'result' | 'history'>('result');
    const originalImage = useObjectURL(files.length > 0 ? files[0].file : null);
    const executionHistory = useExecutionHistory(nodes);

    return (
        <div className={styles.inspectorContent}>
            {/* Tab Headers */}
            <TabGroup
                tabs={[
                    { value: 'result', label: 'Result' },
                    { value: 'history', label: 'History' }
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                fullWidth
            />

            {/* Result Tab */}
            <TabPanel value="result" activeTab={activeTab}>
                <div className={styles.field}>
                    <label className={styles.label}>Before / After</label>
                    <div className={styles.comparisonContainer}>
                        <div className={styles.imageWrapper}>
                            <span className={styles.imageLabel}>Before</span>
                            <ImageBox
                                src={originalImage}
                                alt="Original"
                                aspectRatio={1}
                                theme="dark"
                                emptyText="None"
                                className={styles.imageBox}
                                imgClassName={styles.resultImage}
                            />
                        </div>
                        <div className={styles.arrow}>↓</div>
                        <div className={styles.imageWrapper}>
                            <span className={styles.imageLabel}>After</span>
                            <ImageBox
                                src={resultImage}
                                alt="Result"
                                aspectRatio={1}
                                theme="dark"
                                emptyText="No result"
                                className={styles.imageBox}
                                imgClassName={styles.resultImage}
                            />
                        </div>
                    </div>
                </div>
            </TabPanel>

            {/* History Tab - Pipeline View */}
            <TabPanel value="history" activeTab={activeTab}>
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
            </TabPanel>
        </div>
    );
}
