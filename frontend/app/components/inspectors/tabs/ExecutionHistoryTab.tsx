// 役割: Result Inspector の実行履歴パイプラインタブ
import type { ExecutionHistoryItem } from '@/hooks/useExecutionHistory';
import { PipelineImage } from './PipelineImage';
import { PipelineArrow } from './PipelineArrow';
import styles from '../../NodeInspector.module.css';

type ExecutionHistoryTabProps = {
    originalImage: string | null;
    executionHistory: ExecutionHistoryItem[];
};

export function ExecutionHistoryTab({ originalImage, executionHistory }: ExecutionHistoryTabProps) {
    return (
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
    );
}
