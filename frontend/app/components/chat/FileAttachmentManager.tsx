'use client';

import { useCallback, useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { ImageBox } from '@/components/ui/ImageBox';
import type { ChatMessageImage } from '@/lib/chatService';

import styles from '@/app/page.module.css';

export interface FileAttachmentManagerProps {
  attachedImages: ChatMessageImage[];
  onImagesChange: (images: ChatMessageImage[]) => void;
  disabled?: boolean;
}

/**
 * ファイル添付管理コンポーネント
 * 役割: ファイル選択UI、base64変換、プレビュー表示
 */
export function FileAttachmentManager({
  attachedImages,
  onImagesChange,
  disabled = false,
}: FileAttachmentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択時の処理: 画像をbase64に変換して添付リストに追加
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;

      const newImages: ChatMessageImage[] = [];
      for (const file of Array.from(selectedFiles)) {
        if (!file.type.startsWith('image/')) continue;
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            // data:image/png;base64,XXXX から base64 部分のみ抽出
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = (error) => reject(error);
        });
        newImages.push({ name: file.name, base64, mimeType: file.type });
      }
      onImagesChange([...attachedImages, ...newImages]);
      // input をリセットして同じファイルを再選択可能にする
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [attachedImages, onImagesChange]
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      onImagesChange(attachedImages.filter((_, i) => i !== index));
    },
    [attachedImages, onImagesChange]
  );

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {attachedImages.length > 0 && (
        <div className={styles.chatAttachmentPreview}>
          {attachedImages.map((img, i) => (
            <div key={i} className={styles.chatAttachmentThumb}>
              <ImageBox
                src={`data:${img.mimeType};base64,${img.base64}`}
                alt={img.name}
                width={52}
                height={52}
                objectFit="cover"
                theme="light"
                className={styles.chatAttachmentImg}
              />
              <IconButton
                size="sm"
                className={styles.chatAttachmentRemove}
                onClick={() => handleRemoveImage(i)}
                aria-label={`${img.name} を削除`}
              >
                <X size={12} />
              </IconButton>
            </div>
          ))}
        </div>
      )}

      <IconButton
        size="md"
        className={styles.chatAttachBtn}
        onClick={handleAttachClick}
        disabled={disabled}
        aria-label="画像を添付"
        title="画像を添付"
      >
        <Paperclip size={16} />
      </IconButton>
    </>
  );
}
