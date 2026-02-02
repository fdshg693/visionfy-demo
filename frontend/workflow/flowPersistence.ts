import type { FlowSnapshot } from '@/workflow/flowSerializer';
import { formatSnapshotDate } from '@/workflow/formatDate';
import { storageService } from '@/workflow/storageService';

const FLOW_STORAGE_KEY = 'visionfy.flow';
const FLOW_HISTORY_STORAGE_KEY = 'visionfy.flow.history';
const FLOW_STORAGE_VERSION = 2;
const MAX_HISTORY_ENTRIES = 20;

export type FlowHistoryEntry = {
  id: string;
  createdAt: string;
  name: string;
  snapshot: FlowSnapshot;
};

type PersistedFlowHistory = {
  version: number;
  entries: FlowHistoryEntry[];
};

const isValidSnapshot = (value: unknown): value is FlowSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as FlowSnapshot;
  return (
    Array.isArray(snapshot.nodes) &&
    Array.isArray(snapshot.edges) &&
    typeof snapshot.viewport === 'object' &&
    snapshot.viewport !== null
  );
};

const createDefaultName = (createdAt: string) => {
  return `スナップショット ${formatSnapshotDate(createdAt)}`;
};

const normalizeSnapshot = (snapshot: FlowSnapshot): FlowSnapshot => {
  return {
    ...snapshot,
    nodes: snapshot.nodes.map((node) =>
      node.type === 'custom' ? { ...node, type: 'processNode' } : node
    ),
  };
};

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
  storageService.removeItem(FLOW_STORAGE_KEY);
  storageService.removeItem(FLOW_HISTORY_STORAGE_KEY);
};

export const saveFlowHistory = (entries: FlowHistoryEntry[]) => {
  const payload: PersistedFlowHistory = {
    version: FLOW_STORAGE_VERSION,
    entries,
  };
  storageService.setItem(FLOW_HISTORY_STORAGE_KEY, JSON.stringify(payload));
};

export const loadFlowHistory = (): FlowHistoryEntry[] => {
  const rawHistory = storageService.getItem(FLOW_HISTORY_STORAGE_KEY);
  if (rawHistory) {
    try {
      const parsed = JSON.parse(rawHistory) as PersistedFlowHistory;
      if (parsed.version !== FLOW_STORAGE_VERSION) return [];
      if (!Array.isArray(parsed.entries)) return [];
      return parsed.entries
        .filter(
        (entry) =>
          typeof entry.id === 'string' &&
          typeof entry.createdAt === 'string' &&
          isValidSnapshot(entry.snapshot)
        )
        .map((entry) => ({
          ...entry,
          name: entry.name?.trim()
            ? entry.name.trim()
            : createDefaultName(entry.createdAt),
          snapshot: normalizeSnapshot(entry.snapshot),
        }));
    } catch {
      return [];
    }
  }

  const rawLegacy = storageService.getItem(FLOW_STORAGE_KEY);
  if (!rawLegacy) return [];
  try {
    const parsed = JSON.parse(rawLegacy) as { version?: number; snapshot?: FlowSnapshot };
    if (!parsed.snapshot || !isValidSnapshot(parsed.snapshot)) return [];
    return [
      {
        id: 'snapshot-legacy',
        createdAt: new Date().toISOString(),
        name: 'スナップショット',
        snapshot: normalizeSnapshot(parsed.snapshot),
      },
    ];
  } catch {
    return [];
  }
};
