'use client';

import { useCallback, useState } from 'react';
import { MessageCircle, Settings, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';

import styles from '@/app/page.module.css';
import type { ChatMessage, ChatMessageImage } from '@/lib/chatService';
import { storageService } from '@/lib/storageService';
import { useWorkflowContext } from '@/hooks/useWorkflowContext';
import { useInspector } from '@/contexts/InspectorContext';
import { useChatThreads } from '@/hooks/useChatThreads';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { ThreadMenu } from './ThreadMenu';
import { ToolList } from './ToolList';
import { ChatSettingsPanel } from './ChatSettingsPanel';
import { ChatMessageList } from './ChatMessageList';
import { ChatInputArea } from './ChatInputArea';

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
  const [showSettings, setShowSettings] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return storageService.getItem('visionfy-custom-system-prompt') || '';
  });

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

  const handleClear = useCallback(() => {
    clearMessages();
    setInput('');
  }, [clearMessages]);

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
        <IconButton
          size="sm"
          className={styles.chatSettingsBtn}
          onClick={() => setShowSettings((v) => !v)}
          aria-label="システムプロンプト設定"
          title="システムプロンプト設定"
        >
          <Settings size={14} />
        </IconButton>
        <IconButton
          size="sm"
          onClick={handleClear}
          disabled={messages.length === 0}
          aria-label="チャットをクリア"
          title="チャットをクリア"
        >
          <Trash2 size={14} />
        </IconButton>
      </div>

      <ChatSettingsPanel
        visible={showSettings}
        customPrompt={customPrompt}
        onCustomPromptChange={setCustomPrompt}
        onClose={() => setShowSettings(false)}
      />

      <ChatMessageList messages={messages} />

      <ChatInputArea
        input={input}
        onInputChange={setInput}
        attachedImages={attachedImages}
        onAttachedImagesChange={setAttachedImages}
        onSend={handleSend}
        disabled={isLoading}
      />

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
