'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Settings, Trash2 } from 'lucide-react';

import styles from '@/app/page.module.css';
import type { ChatMessage } from '@/lib/chatService';
import { storageService } from '@/lib/storageService';
import { SYSTEM_PROMPT } from '@/lib/chatPrompts';
import { useWorkflowContext } from '@/hooks/useWorkflowContext';
import { useInspector } from '@/contexts/InspectorContext';
import { useChatThreads } from '@/hooks/useChatThreads';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { MessageContent } from './MessageContent';
import { ThreadMenu } from './ThreadMenu';
import { ToolList } from './ToolList';

/**
 * GEMINIとのチャットパネルコンポーネント
 * NEXTのAPIルートを介してメッセージを送受信します。
 * AIはツールを使用してワークフローコンテキストを動的に取得します。
 * マークダウン対応、リサイズ可能、スレッド管理機能付き。
 */
export function ChatPanel() {
  const { nodes, edges, nodeResults } = useWorkflowContext();
  const { files } = useInspector();
  const {
    threads,
    activeThreadId,
    messages,
    createNewThread,
    selectThread,
    deleteThreadById,
    addMessage,
    updateLastAssistantMessage,
    saveCurrentThread,
    clearMessages,
  } = useChatThreads();
  const { width, isResizing, handleMouseDown } = useResizablePanel({
    initialWidth: 320,
    minWidth: 240,
    maxWidth: 600,
    storageKey: 'visionfy-chat-panel-width',
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return storageService.getItem('visionfy-custom-system-prompt') || '';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージ更新時に末尾へスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // チャット内容をAIに送信
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      // 元画像をbase64に変換（ファイルがある場合のみ）
      let originalImage: string | undefined;
      if (files.length > 0) {
        originalImage = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(files[0].file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          nodes,
          edges,
          originalImage,
          nodeResults,
          ...(customPrompt ? { customSystemPrompt: customPrompt } : {}),
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

      addMessage({ role: 'assistant', content: '' });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });
        updateLastAssistantMessage(assistantContent);
      }

      // ストリーミング完了後にスレッドを保存
      saveCurrentThread();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'エラーが発生しました';
      addMessage({ role: 'assistant', content: `エラー: ${msg}` });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, nodes, edges, files, nodeResults, customPrompt, addMessage, updateLastAssistantMessage, saveCurrentThread]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleClear = useCallback(() => {
    clearMessages();
    setInput('');
  }, [clearMessages]);

  const handleSavePrompt = useCallback(() => {
    if (customPrompt.trim()) {
      storageService.setItem('visionfy-custom-system-prompt', customPrompt);
    } else {
      storageService.removeItem('visionfy-custom-system-prompt');
      setCustomPrompt('');
    }
    setShowSettings(false);
  }, [customPrompt]);

  const handleResetPrompt = useCallback(() => {
    storageService.removeItem('visionfy-custom-system-prompt');
    setCustomPrompt('');
  }, []);

  return (
    <div
      className={styles.chatPanel}
      style={{ width, flexShrink: 0 }}
    >
      <div className={styles.chatHeader}>
        <ThreadMenu
          threads={threads}
          activeThreadId={activeThreadId}
          onNewThread={createNewThread}
          onSelectThread={selectThread}
          onDeleteThread={deleteThreadById}
        />
        <MessageCircle size={16} />
        <span>AI チャット</span>
        <ToolList />
        <button
          type="button"
          className={styles.chatSettingsBtn}
          onClick={() => setShowSettings((v) => !v)}
          aria-label="システムプロンプト設定"
          title="システムプロンプト設定"
        >
          <Settings size={14} />
        </button>
        <button
          type="button"
          className={styles.chatClearBtn}
          onClick={handleClear}
          disabled={messages.length === 0}
          aria-label="チャットをクリア"
          title="チャットをクリア"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {showSettings && (
        <div className={styles.chatSettingsPanel}>
          <label className={styles.chatSettingsLabel}>システムプロンプト</label>
          <textarea
            className={styles.chatSettingsTextarea}
            value={customPrompt || SYSTEM_PROMPT}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={6}
          />
          <div className={styles.chatSettingsBtnGroup}>
            <button
              type="button"
              className={styles.chatSettingsResetBtn}
              onClick={handleResetPrompt}
            >
              デフォルトに戻す
            </button>
            <button
              type="button"
              className={styles.chatSettingsSaveBtn}
              onClick={handleSavePrompt}
            >
              保存
            </button>
          </div>
        </div>
      )}

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
            {msg.role === 'assistant' ? (
              <MessageContent content={msg.content} />
            ) : (
              msg.content
            )}
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

      {/* リサイズハンドル */}
      <div
        className={styles.chatResizeHandle}
        onMouseDown={handleMouseDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="チャットパネルのサイズ変更"
        style={isResizing ? { backgroundColor: '#c7d2fe' } : undefined}
      />
    </div>
  );
}
