
import styles from '../NodeInspector.module.css';

interface EndNodeInspectorProps {
    resultImage: string | null;
    files: any[];
}

export function EndNodeInspector({ resultImage, files }: EndNodeInspectorProps) {
    const originalImage = files.length > 0 ? (URL.createObjectURL(files[0].file) as string) : null;

    return (
        <div className={styles.inspectorContent}>
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
        </div>
    );
}
