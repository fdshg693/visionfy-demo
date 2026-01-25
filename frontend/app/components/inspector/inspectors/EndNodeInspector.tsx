
import styles from '../NodeInspector.module.css';

interface EndNodeInspectorProps {
    resultImage: string | null;
}

export function EndNodeInspector({ resultImage }: EndNodeInspectorProps) {
    return (
        <div className={styles.inspectorContent}>
            <div className={styles.field}>
                <label className={styles.label}>Result</label>
                <div className={styles.resultContainer}>
                    {resultImage ? (
                        <img src={resultImage} alt="Result" className={styles.resultImage} />
                    ) : (
                        <div className={styles.emptyResult}>
                            No result yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
