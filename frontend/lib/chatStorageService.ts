import type { ChatMessage } from '@/lib/chatService';

const STORAGE_KEY = 'visionfy-chat-threads';

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function loadThreads(): ChatThread[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const threads: ChatThread[] = JSON.parse(raw);
    return threads.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveThread(thread: ChatThread): void {
  if (!canUseStorage()) return;
  try {
    const threads = loadThreads();
    const index = threads.findIndex((t) => t.id === thread.id);
    if (index >= 0) {
      threads[index] = thread;
    } else {
      threads.push(thread);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {}
}

export function deleteThread(threadId: string): void {
  if (!canUseStorage()) return;
  try {
    const threads = loadThreads();
    const filtered = threads.filter((t) => t.id !== threadId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

export function generateThreadTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';
  const text = firstUserMessage.content.trim();
  if (text.length <= 30) return text;
  return text.slice(0, 30) + '...';
}
