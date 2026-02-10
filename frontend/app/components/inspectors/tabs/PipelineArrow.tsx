// 役割: パイプラインビューの矢印と処理ステップ名を表示するコンポーネント
import styles from '../../NodeInspector.module.css';

type PipelineArrowProps = {
    index: number;
    functionName: string;
};

export function PipelineArrow({ index, functionName }: PipelineArrowProps) {
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
