'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Paperclip, Send, Settings, Trash2, X } from 'lucide-react';

import styles from '@/app/page.module.css';
import buttonStyles from '@/lib/styles/buttons.module.css';
import formStyles from '@/lib/styles/forms.module.css';
import type { ChatMessage, ChatMessageImage } from '@/lib/chatService';
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
  const [attachedImages, setAttachedImages] = useState<ChatMessageImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setAttachedImages((prev) => [...prev, ...newImages]);
      // input をリセットして同じファイルを再選択可能にする
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    []
  );

  const handleRemoveImage = useCallback((index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // チャット内容をAIに送信
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      ...(attachedImages.length > 0 ? { images: attachedImages } : {}),
    };
    addMessage(userMessage);
    setInput('');
    setAttachedImages([]);
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
  }, [input, isLoading, messages, nodes, edges, files, nodeResults, customPrompt, attachedImages, addMessage, updateLastAssistantMessage, saveCurrentThread]);

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
          className={`${buttonStyles['btn-icon-sm']} ${styles.chatSettingsBtn}`}
          onClick={() => setShowSettings((v) => !v)}
          aria-label="システムプロンプト設定"
          title="システムプロンプト設定"
        >
          <Settings size={14} />
        </button>
        <button
          type="button"
          className={buttonStyles['btn-icon-sm']}
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
            className={formStyles['input-textarea']}
            value={customPrompt || SYSTEM_PROMPT}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={6}
          />
          <div className={styles.chatSettingsBtnGroup}>
            <button
              type="button"
              className={buttonStyles['btn-secondary-sm']}
              onClick={handleResetPrompt}
            >
              デフォルトに戻す
            </button>
            <button
              type="button"
              className={buttonStyles['btn-primary-sm']}
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
              <>
                {msg.images && msg.images.length > 0 && (
                  <div className={styles.chatMessageImages}>
                    {msg.images.map((img, j) => (
                      <div key={j} className={styles.chatMessageImageThumb}>
                        {img.base64 ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={`data:${img.mimeType};base64,${img.base64}`}
                            alt={img.name}
                            className={styles.chatMessageImageImg}
                          />
                        ) : (
                          <div className={styles.chatMessageImagePlaceholder}>
                            <Paperclip size={16} />
                          </div>
                        )}
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
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.chatInputArea}>
        {attachedImages.length > 0 && (
          <div className={styles.chatAttachmentPreview}>
            {attachedImages.map((img, i) => (
              <div key={i} className={styles.chatAttachmentThumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${img.mimeType};base64,${img.base64}`}
                  alt={img.name}
                  className={styles.chatAttachmentImg}
                />
                <button
                  type="button"
                  className={styles.chatAttachmentRemove}
                  onClick={() => handleRemoveImage(i)}
                  aria-label={`${img.name} を削除`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className={styles.chatInputRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className={`${buttonStyles['btn-icon-md']} ${styles.chatAttachBtn}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            aria-label="画像を添付"
            title="画像を添付"
          >
            <Paperclip size={16} />
          </button>
          <textarea
            className={formStyles['input-textarea']}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (Enter で送信)"
            rows={2}
            disabled={isLoading}
          />
          <button
            type="button"
            className={`${buttonStyles['btn-icon-md']} ${buttonStyles['btn-icon-primary']} ${styles.chatSendBtn}`}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="送信"
          >
            <Send size={16} />
          </button>
        </div>
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
