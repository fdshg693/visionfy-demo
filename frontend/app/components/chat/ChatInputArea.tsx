'use client';

import { useCallback } from 'react';
import { Send } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { FileAttachmentManager } from './FileAttachmentManager';
import type { ChatMessageImage } from '@/lib/chatService';

import styles from '@/app/page.module.css';
import formStyles from '@/lib/styles/forms.module.css';

export interface ChatInputAreaProps {
  input: string;
  onInputChange: (value: string) => void;
  attachedImages: ChatMessageImage[];
  onAttachedImagesChange: (images: ChatMessageImage[]) => void;
  onSend: () => void;
  disabled?: boolean;
}

/**
 * チャット入力エリアコンポーネント
 * 役割: テキスト入力、ファイル添付プレビュー、送信ボタン
 */
export function ChatInputArea({
  input,
  onInputChange,
  attachedImages,
  onAttachedImagesChange,
  onSend,
  disabled = false,
}: ChatInputAreaProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <div className={styles.chatInputArea}>
      <div className={styles.chatInputRow}>
        <FileAttachmentManager
          attachedImages={attachedImages}
          onImagesChange={onAttachedImagesChange}
          disabled={disabled}
        />
        <textarea
          className={formStyles['input-textarea']}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力... (Enter で送信)"
          rows={2}
          disabled={disabled}
        />
        <IconButton
          size="md"
          iconVariant="primary"
          className={styles.chatSendBtn}
          onClick={onSend}
          disabled={!input.trim() || disabled}
          aria-label="送信"
        >
          <Send size={16} />
        </IconButton>
      </div>
    </div>
  );
}
