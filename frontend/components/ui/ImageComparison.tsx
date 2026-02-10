import { ImageBox } from './ImageBox';
import styles from './ImageComparison.module.css';

export interface ImageComparisonProps {
  /** Source URL for the "before" image */
  beforeSrc?: string | null;
  /** Alt text for the "before" image */
  beforeAlt: string;
  /** Source URL for the "after" image */
  afterSrc?: string | null;
  /** Alt text for the "after" image */
  afterAlt: string;
  /** Label text for the "before" image */
  beforeLabel?: string;
  /** Label text for the "after" image */
  afterLabel?: string;
  /** Text to display when before image is empty */
  beforeEmptyText?: string;
  /** Text to display when after image is empty */
  afterEmptyText?: string;
  /** Theme variant (light or dark) */
  theme?: 'light' | 'dark';
  /** Aspect ratio for the image boxes */
  aspectRatio?: string | number;
  /** Additional CSS class for the container */
  className?: string;
  /** Additional CSS class for individual ImageBox components */
  imageBoxClassName?: string;
  /** Additional CSS class for the img element inside ImageBox */
  imgClassName?: string;
}

/**
 * Reusable Before/After image comparison component.
 * Displays two images side-by-side (or stacked on mobile) with labels and an arrow between them.
 *
 * Features:
 * - Customizable labels ("Before"/"After" by default)
 * - Light/dark theme support
 * - Empty state handling for both images
 * - Flexible aspect ratio
 * - Consistent styling across the app
 */
export function ImageComparison({
  beforeSrc,
  beforeAlt,
  afterSrc,
  afterAlt,
  beforeLabel = 'Before',
  afterLabel = 'After',
  beforeEmptyText = 'None',
  afterEmptyText = 'No result',
  theme = 'light',
  aspectRatio = 1,
  className = '',
  imageBoxClassName = '',
  imgClassName = '',
}: ImageComparisonProps) {
  return (
    <div className={`${styles.comparisonContainer} ${className}`}>
      <div className={styles.imageWrapper}>
        <span className={styles.imageLabel}>{beforeLabel}</span>
        <ImageBox
          src={beforeSrc}
          alt={beforeAlt}
          aspectRatio={aspectRatio}
          theme={theme}
          emptyText={beforeEmptyText}
          className={imageBoxClassName}
          imgClassName={imgClassName}
        />
      </div>
      <div className={styles.arrow}>↓</div>
      <div className={styles.imageWrapper}>
        <span className={styles.imageLabel}>{afterLabel}</span>
        <ImageBox
          src={afterSrc}
          alt={afterAlt}
          aspectRatio={aspectRatio}
          theme={theme}
          emptyText={afterEmptyText}
          className={imageBoxClassName}
          imgClassName={imgClassName}
        />
      </div>
    </div>
  );
}
