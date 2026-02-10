import type { ChatMessage } from '@/lib/chatService';
import { storageService } from '@/lib/storageService';

const STORAGE_KEY = 'visionfy-chat-threads';

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export function loadThreads(): ChatThread[] {
  try {
    const raw = storageService.getItem(STORAGE_KEY);
    if (!raw) return [];
    const threads: ChatThread[] = JSON.parse(raw);
    return threads.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

/**
 * 永続化時に画像のbase64データを除去してストレージ容量を節約する。
 * ファイル名とMIMEタイプは保持し、UIで添付履歴を表示できるようにする。
 */
function stripImageData(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((msg) => {
    if (!msg.images || msg.images.length === 0) return msg;
    return {
      ...msg,
      images: msg.images.map((img) => ({
        name: img.name,
        base64: '',
        mimeType: img.mimeType,
      })),
    };
  });
}

export function saveThread(thread: ChatThread): void {
  try {
    const threadToSave = {
      ...thread,
      messages: stripImageData(thread.messages),
    };
    const threads = loadThreads();
    const index = threads.findIndex((t) => t.id === thread.id);
    if (index >= 0) {
      threads[index] = threadToSave;
    } else {
      threads.push(threadToSave);
    }
    storageService.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {}
}

export function deleteThread(threadId: string): void {
  try {
    const threads = loadThreads();
    const filtered = threads.filter((t) => t.id !== threadId);
    storageService.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

export function generateThreadTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';
  const text = firstUserMessage.content.trim();
  if (text.length <= 30) return text;
  return text.slice(0, 30) + '...';
}
