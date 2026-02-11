// 役割: パイプラインビューの画像表示コンポーネント
import { ImageBox } from '@/components/ui/ImageBox';
import styles from '../../NodeInspector.module.css';

type PipelineImageProps = {
    src: string;
    alt: string;
    label?: string;
};

export function PipelineImage({ src, alt, label }: PipelineImageProps) {
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
