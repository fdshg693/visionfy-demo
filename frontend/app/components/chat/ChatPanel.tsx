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
    initialWidth: 400,
    minWidth: 280,
    maxWidth: 700,
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
   * ストリーム完了後、[WORKFLOW_SESSION:sessionId]マーカーを検出して
   * セッションAPIからワークフローを取得・適用する
   * @returns マーカーを除去した文字列
   */
  const applyWorkflowFromSession = useCallback(async (content: string): Promise<string> => {
    console.log('[ChatPanel] applyWorkflowFromSession called with content length:', content.length);
    console.log('[ChatPanel] Content preview:', content.substring(0, 200));

    const marker = /\[WORKFLOW_SESSION:([^\]]+)\]/;
    const match = content.match(marker);

    if (!match) {
      console.log('[ChatPanel] No WORKFLOW_SESSION marker found');
      return content;
    }

    const sessionId = match[1];
    console.log('[ChatPanel] Found sessionId:', sessionId);

    try {
      console.log('[ChatPanel] Fetching workflow from session API...');
      const response = await fetch(`/api/apply-workflow?sessionId=${sessionId}`);
      console.log('[ChatPanel] Session API response status:', response.status);

      if (!response.ok) {
        console.error('[ChatPanel] Session API failed with status:', response.status);
        return content.replace(marker, '');
      }

      const { workflowData } = await response.json();
      console.log('[ChatPanel] Received workflowData:', JSON.stringify(workflowData, null, 2));

      if (isSimpleWorkflow(workflowData)) {
        console.log('[ChatPanel] workflowData is valid SimpleWorkflow, converting to snapshot...');
        const snapshot = convertSimpleWorkflowToSnapshot(workflowData);
        console.log('[ChatPanel] Snapshot created with nodes:', snapshot.nodes.length, 'edges:', snapshot.edges.length);

        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
        setViewport(snapshot.viewport);
        console.log('[ChatPanel] Workflow applied to canvas successfully');
        showSuccess('ワークフロー生成', 'AIがワークフローをキャンバスに適用しました');
      } else {
        console.error('[ChatPanel] workflowData is not a valid SimpleWorkflow');
      }
    } catch (error) {
      console.error('[ChatPanel] Error in applyWorkflowFromSession:', error);
    }

    return content.replace(marker, '');
  }, [setNodes, setEdges, setViewport, showSuccess]);

  /**
   * ストリーム完了後、[IMAGE_SESSION:sessionId]マーカーを検出して
   * セッションAPIから画像データを取得する
   * @returns マーカーを除去した文字列と画像データ
   */
  const fetchImageFromSession = useCallback(async (content: string): Promise<{
    cleanedContent: string;
    imageData?: { description: string; base64: string; mimeType: string };
  }> => {
    const marker = /\[IMAGE_SESSION:([^\]]+)\]/;
    const match = content.match(marker);
    if (!match) return { cleanedContent: content };

    const sessionId = match[1];
    try {
      const response = await fetch(`/api/image-session?sessionId=${sessionId}`);
      if (!response.ok) return { cleanedContent: content.replace(marker, '') };

      const { imageData } = await response.json();
      return {
        cleanedContent: content.replace(marker, ''),
        imageData: imageData as { description: string; base64: string; mimeType: string },
      };
    } catch {
      return { cleanedContent: content.replace(marker, '') };
    }
  }, []);

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

      /**
       * AIにメッセージを送信してストリーミングレスポンスを受信する
       * @param allMessages 送信するメッセージ配列（履歴含む）
       * @returns アシスタントの応答コンテンツ
       */
      const callAI = async (allMessages: ChatMessage[]): Promise<string> => {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages,
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

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let content = '';

        addMessage({ role: 'assistant', content: '' });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
          updateLastAssistantMessage(content);
        }

        return content;
      };

      /**
       * アシスタントの応答をポスト処理する
       * ワークフローセッションの適用、画像セッションの検出を行う
       * @param content アシスタントの応答コンテンツ
       * @returns 処理後のコンテンツ
       */
      const postProcess = async (content: string): Promise<string> => {
        console.log('[ChatPanel] postProcess called with content length:', content.length);
        console.log('[ChatPanel] Checking for WORKFLOW_SESSION marker...');
        console.log('[ChatPanel] Content includes "[WORKFLOW_SESSION:"?', content.includes('[WORKFLOW_SESSION:'));

        // ワークフローセッションがあれば取得・適用
        if (content.includes('[WORKFLOW_SESSION:')) {
          console.log('[ChatPanel] WORKFLOW_SESSION marker detected, calling applyWorkflowFromSession...');
          content = await applyWorkflowFromSession(content);
          updateLastAssistantMessage(content);
        } else {
          console.log('[ChatPanel] No WORKFLOW_SESSION marker found in content');
        }
        return content;
      };

      // 1回目のAI呼び出し
      let currentMessages = [...messages, userMessage];
      let assistantContent = await callAI(currentMessages);
      assistantContent = await postProcess(assistantContent);

      // 画像セッションがあれば取得し、ユーザーメッセージとして追加して再度AIを呼び出す
      if (assistantContent.includes('[IMAGE_SESSION:')) {
        const { cleanedContent, imageData } = await fetchImageFromSession(assistantContent);
        assistantContent = cleanedContent;
        updateLastAssistantMessage(assistantContent);

        if (imageData) {
          // base64データからdata:プレフィックスを除去
          const base64WithoutPrefix = imageData.base64.includes(',')
            ? imageData.base64.split(',')[1]
            : imageData.base64;

          const imageMessage: ChatMessage = {
            role: 'user',
            content: `[AI画像取得] ${imageData.description}`,
            images: [{
              name: imageData.description,
              base64: base64WithoutPrefix,
              mimeType: imageData.mimeType,
            }],
          };
          addMessage(imageMessage);

          // メッセージ履歴を更新して再度AIを呼び出す
          currentMessages = [
            ...currentMessages,
            { role: 'assistant' as const, content: assistantContent },
            imageMessage,
          ];
          const secondContent = await callAI(currentMessages);
          await postProcess(secondContent);
        }
      }

      // ストリーミング完了後にスレッドを保存
      saveCurrentThread();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'エラーが発生しました';
      addMessage({ role: 'assistant', content: `エラー: ${msg}` });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, nodes, edges, files, nodeResults, customPrompt, attachedImages, addMessage, updateLastAssistantMessage, saveCurrentThread, applyWorkflowFromSession, fetchImageFromSession]);

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
