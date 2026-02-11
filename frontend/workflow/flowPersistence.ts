// ワークフローのスナップショット保存・復元機能
// 責務: localStorage操作のみに特化
import type { FlowSnapshot, FlowHistoryEntry, PersistedFlowHistory } from '@/types/workflowPersistence';
import { validateHistoryEntry } from '@/workflow/workflowValidator';
import { normalizeSnapshot } from '@/workflow/workflowConverter';
import { formatSnapshotDate } from '@/lib/formatDate';
import { storageService } from '@/lib/storageService';

const FLOW_HISTORY_STORAGE_KEY = 'visionfy.flow.history';
const MAX_HISTORY_ENTRIES = 20;

/** スナップショット名のデフォルト生成 */
const createDefaultName = (createdAt: string) => {
  return `スナップショット ${formatSnapshotDate(createdAt)}`;
};

// ====================== 単一スナップショットの保存・読み込み・削除 ======================

export const saveFlowSnapshot = (snapshot: FlowSnapshot, name?: string) => {
  const normalizedSnapshot = normalizeSnapshot(snapshot);
  const createdAt = new Date().toISOString();
  const entry: FlowHistoryEntry = {
    id: `snapshot-${Date.now()}`,
    createdAt,
    name: name?.trim() ? name.trim() : createDefaultName(createdAt),
    snapshot: normalizedSnapshot,
  };
  const existing = loadFlowHistory();
  const entries = [entry, ...existing].slice(0, MAX_HISTORY_ENTRIES);
  saveFlowHistory(entries);
  return entry;
};

export const loadFlowSnapshot = (): FlowSnapshot | null => {
  const history = loadFlowHistory();
  return history[0]?.snapshot ?? null;
};

export const clearFlowSnapshot = () => {
  storageService.removeItem(FLOW_HISTORY_STORAGE_KEY);
};

// ====================== 履歴全体の保存・読み込み ======================

export const saveFlowHistory = (entries: FlowHistoryEntry[]) => {
  const payload: PersistedFlowHistory = {
    entries,
  };
  storageService.setItem(FLOW_HISTORY_STORAGE_KEY, JSON.stringify(payload));
};

export const loadFlowHistory = (): FlowHistoryEntry[] => {
  const rawHistory = storageService.getItem(FLOW_HISTORY_STORAGE_KEY);
  if (rawHistory) {
    try {
      const parsed = JSON.parse(rawHistory) as PersistedFlowHistory;
      if (!Array.isArray(parsed.entries)) return [];

      return parsed.entries
        .filter(validateHistoryEntry)  // 検証ロジックを validator に委譲
        .map((entry) => ({
          ...entry,
          name: entry.name?.trim()
            ? entry.name.trim()
            : createDefaultName(entry.createdAt),
          snapshot: normalizeSnapshot(entry.snapshot),  // 正規化を converter に委譲
        }));
    } catch {
      return [];
    }
  }
  return [];
};
