'use client';

import { ImageBox } from '@/components/ui/ImageBox';
import type { ChatMessage } from '@/lib/chatService';
import { Paperclip, Loader2 as Spinner } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ChatPlaceholder } from './ChatPlaceholder';
import { MessageContent } from './MessageContent';

import styles from '@/app/page.module.css';

export interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

/**
 * チャットメッセージリストコンポーネント
 * 役割: メッセージレンダリング、自動スクロール
 */
export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージ更新時に末尾へスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className={styles.chatMessages}>
      {messages.length === 0 && <ChatPlaceholder />}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={
            msg.role === 'user'
              ? styles.chatMessageUser
              : styles.chatMessageAssistant
          }
        >
          {msg.role === 'assistant' ? (
            <MessageContent content={msg.content} />
          ) : (
            <>
              {msg.images && msg.images.length > 0 && (
                <div className={styles.chatMessageImages}>
                  {msg.images.map((img, j) => (
                    <div key={j} className={styles.chatMessageImageThumb}>
                      <ImageBox
                        src={img.base64 ? `data:${img.mimeType};base64,${img.base64}` : null}
                        alt={img.name}
                        width={64}
                        height={64}
                        objectFit="cover"
                        theme="light"
                        emptyContent={<Paperclip size={16} />}
                        className={styles.chatMessageImageImg}
                      />
                      <span className={styles.chatMessageImageName}>{img.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {msg.content}
            </>
          )}
        </div>
      ))}

      {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
        <div className={styles.chatMessageAssistant}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', padding: '0.5rem' }}>
            <Spinner className="animate-spin" size={16} />
            <span style={{ fontSize: '0.875rem' }}>考え中...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
