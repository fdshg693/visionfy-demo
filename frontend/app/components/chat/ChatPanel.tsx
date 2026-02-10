'use client';

import { useCallback, useState } from 'react';
import { MessageCircle, Settings, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';

import styles from '@/app/page.module.css';
import type { ChatMessage, ChatMessageImage } from '@/lib/chatService';
import { storageService } from '@/lib/storageService';
import { useWorkflowContext } from '@/hooks/useWorkflowContext';
import { useFlowStore } from '@/workflow/flowStore';
import { useInspector } from '@/contexts/InspectorContext';
import { useChatThreads } from '@/hooks/useChatThreads';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { useWorkflowImages } from '@/hooks/useWorkflowImages';
import type { WorkflowImage } from '@/hooks/useWorkflowImages';
import { convertSimpleWorkflowToSnapshot } from '@/workflow/workflowConverter';
import { isSimpleWorkflow } from '@/types/simpleWorkflow';
import { useToast } from '@/contexts/ToastContext';
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
  const { setNodes, setEdges, setViewport } = useFlowStore();
  const { files } = useInspector();
  const { showSuccess } = useToast();
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
  const workflowImages = useWorkflowImages();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImages, setAttachedImages] = useState<ChatMessageImage[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return storageService.getItem('visionfy-custom-system-prompt') || '';
  });

  /**
   * ストリームから<<WORKFLOW_DATA:base64>>マーカーを検出し、ワークフローをキャンバスに適用する
   * @returns マーカーを除去した文字列
   */
  const applyWorkflowFromStream = useCallback((content: string): string => {
    const marker = /<<WORKFLOW_DATA:(.+?)>>/;
    const match = content.match(marker);
    if (!match) return content;

    try {
      const base64Data = match[1];
      const jsonString = atob(base64Data);
      const parsed = JSON.parse(jsonString);

      if (isSimpleWorkflow(parsed)) {
        const snapshot = convertSimpleWorkflowToSnapshot(parsed);
        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
        setViewport(snapshot.viewport);
        showSuccess('ワークフロー生成', 'AIがワークフローをキャンバスに適用しました');
      }
    } catch {
      // デコードやパースに失敗した場合は無視
    }

    // マーカーを除去して返す
    return content.replace(marker, '');
  }, [setNodes, setEdges, setViewport, showSuccess]);

  // ワークフロー画像選択時の処理
  const handleWorkflowImageSelect = useCallback((image: WorkflowImage) => {
    // data:image/jpeg;base64, プレフィックスを除去
    const base64WithoutPrefix = image.base64.split(',')[1] || image.base64;

    const newImage: ChatMessageImage = {
      name: image.description,
      base64: base64WithoutPrefix,
      mimeType: image.mimeType,
    };

    setAttachedImages((prev) => [...prev, newImage]);
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

      let workflowApplied = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantContent += decoder.decode(value, { stream: true });

        // ワークフローデータマーカーを検出して適用（1回のみ）
        if (!workflowApplied && assistantContent.includes('<<WORKFLOW_DATA:')) {
          const processed = applyWorkflowFromStream(assistantContent);
          if (processed !== assistantContent) {
            assistantContent = processed;
            workflowApplied = true;
          }
        }

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
  }, [input, isLoading, messages, nodes, edges, files, nodeResults, customPrompt, attachedImages, addMessage, updateLastAssistantMessage, saveCurrentThread, applyWorkflowFromStream]);

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
        workflowImages={workflowImages}
        onWorkflowImageSelect={handleWorkflowImageSelect}
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
