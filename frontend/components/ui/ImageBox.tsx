import type { CSSProperties, ReactNode } from 'react';
import styles from './ImageBox.module.css';

export interface ImageBoxProps {
  /** Image source URL (base64 data URL or object URL) */
  src?: string | null;
  /** Alt text for the image */
  alt: string;
  /** Box width (CSS value or number in px) */
  width?: string | number;
  /** Box height (CSS value or number in px) */
  height?: string | number;
  /** Aspect ratio (e.g., "1", "16/9", 1.5) */
  aspectRatio?: string | number;
  /** Image object-fit mode */
  objectFit?: 'contain' | 'cover';
  /** Border radius (CSS value or number in px) */
  borderRadius?: string | number;
  /** Border style (full CSS border value) */
  border?: string;
  /** Background color */
  background?: string;
  /** Text to display when no image is present */
  emptyText?: string;
  /** Custom content to display when no image is present (overrides emptyText) */
  emptyContent?: ReactNode;
  /** Additional CSS class for the container */
  className?: string;
  /** Additional CSS class for the image element */
  imgClassName?: string;
  /** Theme variant (light or dark) */
  theme?: 'light' | 'dark';
}

/**
 * Reusable image box component for displaying images with consistent styling.
 * Used across ProcessNode hover popups, ResultNodeInspector, ChatPanel, and more.
 *
 * Features:
 * - Flexible sizing (width, height, or aspect-ratio)
 * - Light/dark theme variants
 * - Empty state handling
 * - Object-fit support (contain/cover)
 * - Customizable styling
 */
export function ImageBox({
  src,
  alt,
  width,
  height,
  aspectRatio,
  objectFit = 'contain',
  borderRadius,
  border,
  background,
  emptyText = 'No image',
  emptyContent,
  className = '',
  imgClassName = '',
  theme = 'light',
}: ImageBoxProps) {
  const containerStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    aspectRatio: aspectRatio?.toString(),
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    border,
    background,
  };

  const imgStyle: CSSProperties = {
    objectFit,
  };

  const themeClass = theme === 'dark' ? styles.dark : styles.light;

  return (
    <div
      className={`${styles.imageBox} ${themeClass} ${className}`}
      style={containerStyle}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt}
          className={`${styles.image} ${imgClassName}`}
          style={imgStyle}
        />
      ) : (
        <div className={styles.empty}>
          {emptyContent ?? emptyText}
        </div>
      )}
    </div>
  );
}
