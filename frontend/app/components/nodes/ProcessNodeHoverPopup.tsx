// 役割: ProcessNodeのホバー時ポップアップ（入力/出力画像の比較表示）を描画する
// 依存: ImageBox、ProcessNode.module.css
import { ImageBox } from '@/components/ui/ImageBox';
import styles from './ProcessNode.module.css';

type ProcessNodeHoverPopupProps = {
    inputImage: string | null;
    resultImage: string;
};

export function ProcessNodeHoverPopup({ inputImage, resultImage }: ProcessNodeHoverPopupProps) {
    return (
        <div className={styles.hoverPopup}>
            <div className={styles.hoverPopupImages}>
                <div className={styles.hoverPopupImageWrapper}>
                    <span className={styles.hoverPopupLabel}>Input</span>
                    <ImageBox
                        src={inputImage}
                        alt="Input"
                        width={100}
                        height={100}
                        theme="light"
                        emptyText="No input"
                    />
                </div>
                <div className={styles.hoverPopupArrow}>→</div>
                <div className={styles.hoverPopupImageWrapper}>
                    <span className={styles.hoverPopupLabel}>Output</span>
                    <ImageBox
                        src={resultImage}
                        alt="Output"
                        width={100}
                        height={100}
                        theme="light"
                    />
                </div>
            </div>
        </div>
    );
}
