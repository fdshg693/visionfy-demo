// 役割: キャンバス右上にドラッグ可能な画像プレビューオーバーレイを表示。
//       サムネイルクリックでサイドパネルを開くトリガーも担う。
// 依存: InspectorContextから画像状態を取得。useDragでドラッグ移動。useObjectURLで入力URL生成。
'use client';

import { useInspector } from '@/contexts/InspectorContext';
import { useDrag } from '@/hooks/useDrag';
import { useObjectURL } from '@/hooks/useObjectURL';
import type { WorkflowFile } from '@/types/workflow';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import 'filepond/dist/filepond.min.css';
import { useRef } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import styles from './ImagePreviewOverlay.module.css';

registerPlugin(FilePondPluginImagePreview);

type ImagePreviewOverlayProps = {
    onToggleInspector: () => void;
};

/**
 * キャンバス右上のドラッグ可能な画像プレビューオーバーレイ。
 * - ドラッグハンドルで移動可能
 * - サムネイルクリックでサイドパネルを開く
 * - FilePondで画像アップロード
 */
export function ImagePreviewOverlay({ onToggleInspector }: ImagePreviewOverlayProps) {
    const { files, setFiles, previewImage, resultImage } = useInspector();
    const originalImage = useObjectURL(files.length > 0 ? files[0].file : null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { position, isDragging, handleMouseDown } = useDrag({ containerRef });

    const displayResult = previewImage ?? resultImage;

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
                {/* 入力画像 */}
                <div className={styles.imageSlot} onClick={onToggleInspector}>
                    <span className={styles.slotLabel}>Input</span>
                    <div className={styles.thumbnail}>
                        {originalImage ? (
                            <img
                                src={originalImage}
                                alt="入力画像"
                                className={styles.thumbnailImg}
                            />
                        ) : (
                            <span className={styles.noImage}>No Image</span>
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

            {/* FilePond アップロードエリア */}
            <div className={styles.uploadArea}>
                <FilePond
                    files={files as any}
                    onupdatefiles={(nextFiles) => setFiles(nextFiles as unknown as WorkflowFile[])}
                    allowMultiple={false}
                    maxFiles={1}
                    name="files"
                    labelIdle='<div class="filepond--label-action">📷 画像を入れてください</div>'
                    credits={false}
                />
            </div>

            <div className={styles.clickHint}>クリックで詳細を表示</div>
        </div>
    );
}
