'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

import styles from '@/app/page.module.css';
import type { ChatMessage } from '@/lib/chatService';
import { buildWorkflowContext } from '@/lib/chatPrompts';
import { useFlowStore } from '@/workflow/flowStore';

/**
 * GEMINIとのチャットパネルコンポーネント
 * NEXTのAPIルートを介してメッセージを送受信します。
 */
export function ChatPanel() {
  const { nodes, edges } = useFlowStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージ更新時に末尾へスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // チャット内容をAIに送信
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // 新しいチャットを会話履歴に追加
    // 入力欄はクリアし、ロード中状態に設定
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          workflowContext: buildWorkflowContext(nodes, edges),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'リクエストに失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // レスポンスがJSONでない場合はデフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      // アシスタントのプレースホルダーを追加してストリーミング開始
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        // 末尾のアシスタントメッセージを逐次更新
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantContent },
        ]);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'エラーが発生しました';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `エラー: ${msg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, nodes, edges]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatHeader}>
        <MessageCircle size={16} />
        <span>AI チャット</span>
      </div>

      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <p className={styles.chatPlaceholder}>
            Visionfyについて何でも聞いてください
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === 'user'
                ? styles.chatMessageUser
                : styles.chatMessageAssistant
            }
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.chatInputArea}>
        <textarea
          className={styles.chatInputField}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力... (Enter で送信)"
          rows={2}
          disabled={isLoading}
        />
        <button
          type="button"
          className={styles.chatSendBtn}
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          aria-label="送信"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
