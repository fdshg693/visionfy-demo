import { useState, useCallback } from 'react';
import type { ChatMessage } from '@/types/chat';
import {
  type ChatThread,
  loadThreads,
  saveThread,
  deleteThread as deleteThreadFromStorage,
  generateThreadTitle,
} from '@/lib/chatStorageService';

export type { ChatThread };

export function useChatThreads() {
  const [threads, setThreads] = useState<ChatThread[]>(() => loadThreads());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /** Persist the current thread to storage (if it has an id and messages). */
  const saveCurrentThread = useCallback(() => {
    setActiveThreadId((currentId) => {
      if (!currentId) return currentId;
      setMessages((currentMessages) => {
        if (currentMessages.length === 0) return currentMessages;
        const now = Date.now();
        const existing = loadThreads().find((t) => t.id === currentId);
        const thread: ChatThread = {
          id: currentId,
          title: generateThreadTitle(currentMessages),
          messages: currentMessages,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        saveThread(thread);
        setThreads(loadThreads());
        return currentMessages;
      });
      return currentId;
    });
  }, []);

  /** Auto-save helper: saves current thread only when it has messages. */
  const autoSaveCurrent = useCallback(
    (currentId: string | null, currentMessages: ChatMessage[]) => {
      if (!currentId || currentMessages.length === 0) return;
      const now = Date.now();
      const existing = loadThreads().find((t) => t.id === currentId);
      const thread: ChatThread = {
        id: currentId,
        title: generateThreadTitle(currentMessages),
        messages: currentMessages,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      saveThread(thread);
    },
    [],
  );

  /** Create a new (unsaved) thread, auto-saving the current one first. */
  const createNewThread = useCallback(() => {
    setActiveThreadId((prevId) => {
      setMessages((prevMessages) => {
        autoSaveCurrent(prevId, prevMessages);
        return [];
      });
      return null;
    });
    setThreads(loadThreads());
  }, [autoSaveCurrent]);

  /** Switch to an existing thread by id, auto-saving the current one first. */
  const selectThread = useCallback(
    (threadId: string) => {
      setActiveThreadId((prevId) => {
        setMessages((prevMessages) => {
          autoSaveCurrent(prevId, prevMessages);
          const target = loadThreads().find((t) => t.id === threadId);
          return target ? target.messages : [];
        });
        return threadId;
      });
      setThreads(loadThreads());
    },
    [autoSaveCurrent],
  );

  /** Delete a thread by id. If it's the active thread, also clear messages. */
  const deleteThreadById = useCallback(
    (threadId: string) => {
      deleteThreadFromStorage(threadId);
      setActiveThreadId((prevId) => {
        if (prevId === threadId) {
          setMessages([]);
          return null;
        }
        return prevId;
      });
      setThreads(loadThreads());
    },
    [],
  );

  /** Append a message. Creates a new thread on the first message if needed. */
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      const updated = [...prev, message];

      setActiveThreadId((prevId) => {
        const id = prevId ?? `thread-${Date.now()}`;
        const now = Date.now();
        const existing = loadThreads().find((t) => t.id === id);
        const thread: ChatThread = {
          id,
          title: generateThreadTitle(updated),
          messages: updated,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        saveThread(thread);
        setThreads(loadThreads());
        return id;
      });

      return updated;
    });
  }, []);

  /** Update the last assistant message content (used during streaming). */
  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex < 0 || prev[lastIndex].role !== 'assistant') return prev;
      const updated = [...prev];
      updated[lastIndex] = { ...updated[lastIndex], content };
      return updated;
    });
  }, []);

  /** Clear all messages and reset active thread. */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveThreadId(null);
  }, []);

  return {
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
  };
}
