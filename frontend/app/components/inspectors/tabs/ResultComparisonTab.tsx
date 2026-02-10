// 役割: Result Inspector の Before/After 比較タブ
import { ImageComparison } from '@/components/ui/ImageComparison';
import styles from '../../NodeInspector.module.css';

type ResultComparisonTabProps = {
    originalImage: string | null;
    resultImage: string | null;
};

export function ResultComparisonTab({ originalImage, resultImage }: ResultComparisonTabProps) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>Before / After</label>
            <ImageComparison
                beforeSrc={originalImage}
                beforeAlt="Original"
                afterSrc={resultImage}
                afterAlt="Result"
                beforeLabel="Before"
                afterLabel="After"
                beforeEmptyText="None"
                afterEmptyText="No result"
                theme="dark"
                aspectRatio={1}
                imageBoxClassName={styles.imageBox}
                imgClassName={styles.resultImage}
            />
        </div>
    );
}
