'use client';

import { Image } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/Button';
import styles from './WorkflowImagePicker.module.css';

export interface WorkflowImagePickerProps {
    /**
     * 選択可能な画像のリスト
     */
    images: Array<{
        id: string;
        label: string;
        description: string;
        base64: string;
        mimeType: string;
    }>;

    /**
     * 画像が選択されたときのコールバック
     */
    onImageSelect: (image: {
        id: string;
        label: string;
        description: string;
        base64: string;
        mimeType: string;
    }) => void;

    /**
     * ボタンを無効化するかどうか
     */
    disabled?: boolean;
}

/**
 * ワークフロー実行結果の画像を選択するためのドロップダウンコンポーネント
 * チャット入力に画像を添付する際に使用
 */
export function WorkflowImagePicker({
    images,
    onImageSelect,
    disabled = false,
}: WorkflowImagePickerProps) {
    const hasImages = images.length > 0;

    return (
        <Dropdown
            trigger={(isOpen, toggle) => (
                <IconButton
                    size="sm"
                    onClick={toggle}
                    disabled={disabled}
                    aria-label="ワークフロー画像を選択"
                    title="ワークフロー画像を選択"
                    className={styles.triggerButton}
                >
                    <Image size={16} />
                    <span className={styles.triggerText}>ワークフロー画像</span>
                </IconButton>
            )}
            className={styles.dropdown}
            position="top-left"
            closeOnClickInside={true}
        >
            {!hasImages && (
                <div className={styles.emptyMessage}>実行結果がありません</div>
            )}

            {hasImages && (
                <div className={styles.imageList}>
                    {images.map((image) => (
                        <button
                            key={image.id}
                            type="button"
                            className={styles.imageItem}
                            onClick={() => onImageSelect(image)}
                            role="menuitem"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onImageSelect(image);
                                }
                            }}
                        >
                            <div className={styles.imageInfo}>
                                <span className={styles.imageLabel}>{image.label}</span>
                                <span className={styles.imageDescription}>
                                    {image.description}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </Dropdown>
    );
}
