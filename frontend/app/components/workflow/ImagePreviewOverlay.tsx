// 役割: キャンバス右上にドラッグ可能な画像プレビューオーバーレイを表示。
//       サムネイルクリックでサイドパネルを開くトリガーも担う。
// 依存: InspectorContextから画像状態を取得。useDragでドラッグ移動。useObjectURLで入力URL生成。
'use client';

import { useInspector } from '@/contexts/InspectorContext';
import { useDrag } from '@/hooks/useDrag';
import { useObjectURL } from '@/hooks/useObjectURL';
import type { WorkflowFile } from '@/types/workflow';
import { useRef } from 'react';
import styles from './ImagePreviewOverlay.module.css';

type ImagePreviewOverlayProps = {
    onToggleInspector: () => void;
};

/**
 * キャンバス右上のドラッグ可能な画像プレビューオーバーレイ。
 * - ドラッグハンドルで移動可能
 * - サムネイルクリックでサイドパネルを開く
 * - 入力スロット（画像なし時）をクリックでファイル選択
 */
export function ImagePreviewOverlay({ onToggleInspector }: ImagePreviewOverlayProps) {
    const { files, setFiles, previewImage, resultImage } = useInspector();
    const originalImage = useObjectURL(files.length > 0 ? files[0].file : null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { position, isDragging, handleMouseDown } = useDrag({ containerRef });

    const displayResult = previewImage ?? resultImage;

    const handleInputSlotClick = () => {
        if (originalImage) {
            // 画像がある場合はインスペクターを開く
            onToggleInspector();
        } else {
            // 画像がない場合はファイル選択ダイアログを開く
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // WorkflowFile形式に変換してsetFiles
            const workflowFile = {
                source: file,
                options: { type: 'local' },
                file,
            } as unknown as WorkflowFile;
            setFiles([workflowFile]);
        }
        // inputをリセットして同じファイルを再選択可能にする
        e.target.value = '';
    };

    return (
        <div
            ref={containerRef}
            className={`${styles.overlay} ${isDragging ? styles.overlayDragging : ''}`}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
        >
            {/* ドラッグハンドル */}
            <div className={styles.dragHandle} onMouseDown={handleMouseDown}>
                ⣿⣿⣿
            </div>

            {/* サムネイル行 */}
            <div className={styles.imagesRow}>
                {/* 入力画像 - 画像なし時はファイル選択、画像あり時はインスペクター */}
                <div
                    className={`${styles.imageSlot} ${!originalImage ? styles.imageSlotUpload : ''}`}
                    onClick={handleInputSlotClick}
                >
                    <span className={styles.slotLabel}>Input</span>
                    <div className={`${styles.thumbnail} ${!originalImage ? styles.thumbnailUpload : ''}`}>
                        {originalImage ? (
                            <img
                                src={originalImage}
                                alt="入力画像"
                                className={styles.thumbnailImg}
                            />
                        ) : (
                            <span className={styles.noImage}>
                                📷
                                <br />
                                画像なし
                            </span>
                        )}
                    </div>
                </div>

                {/* 結果画像 */}
                <div className={styles.imageSlot} onClick={onToggleInspector}>
                    <span className={styles.slotLabel}>Result</span>
                    <div className={styles.thumbnail}>
                        {displayResult ? (
                            <img
                                src={displayResult}
                                alt="結果画像"
                                className={styles.thumbnailImg}
                            />
                        ) : (
                            <span className={styles.noImage}>No Image</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden file input for upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            <div className={styles.clickHint}>クリックで詳細を表示</div>
        </div>
    );
}
