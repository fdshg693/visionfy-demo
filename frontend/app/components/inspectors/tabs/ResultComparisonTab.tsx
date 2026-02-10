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
            <label className={styles.label}>変更前 / 変更後</label>
            <ImageComparison
                beforeSrc={originalImage}
                beforeAlt="元画像"
                afterSrc={resultImage}
                afterAlt="結果"
                beforeLabel="変更前"
                afterLabel="変更後"
                beforeEmptyText="なし"
                afterEmptyText="結果なし"
                theme="dark"
                aspectRatio={1}
                imageBoxClassName={styles.imageBox}
                imgClassName={styles.resultImage}
            />
        </div>
    );
}
