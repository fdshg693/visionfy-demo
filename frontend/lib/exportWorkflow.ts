/**
 * ワークフローエクスポート機能
 *
 * 役割: スナップショット履歴をJSON形式でエクスポート
 * 対応形式: SimpleWorkflow（簡易形式）/ FlowSnapshot（完全形式）
 */

import type { FlowHistoryEntry, FlowSnapshot, SimpleWorkflow } from '@/types/workflowPersistence';
import { convertSnapshotToSimpleWorkflow } from '@/workflow/workflowConverter';
import { formatSnapshotDate } from '@/lib/formatDate';

/**
 * エクスポート形式
 */
export type ExportFormat = 'simple' | 'full';

/**
 * JSONファイルとしてダウンロード
 */
const downloadJSON = (data: unknown, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // クリーンアップ
  URL.revokeObjectURL(url);
};

/**
 * エクスポート用のファイル名を生成
 */
const createFilename = (entry: FlowHistoryEntry, format: ExportFormat): string => {
  const date = formatSnapshotDate(entry.createdAt);
  const formatSuffix = format === 'simple' ? 'simple' : 'full';
  const safeName = entry.name.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, '_');
  return `${safeName}_${date}_${formatSuffix}.json`;
};

/**
 * スナップショットを指定形式に変換
 */
const convertSnapshot = (snapshot: FlowSnapshot, format: ExportFormat): SimpleWorkflow | FlowSnapshot => {
  if (format === 'simple') {
    return convertSnapshotToSimpleWorkflow(snapshot);
  }
  return snapshot;
};

/**
 * 単一の履歴エントリをエクスポート
 */
export const exportSingleHistory = (entry: FlowHistoryEntry, format: ExportFormat) => {
  const data = convertSnapshot(entry.snapshot, format);
  const filename = createFilename(entry, format);
  downloadJSON(data, filename);
};

/**
 * 複数の履歴エントリを一括エクスポート
 */
export const exportMultipleHistories = (entries: FlowHistoryEntry[], format: ExportFormat) => {
  entries.forEach((entry) => {
    // ブラウザによるダウンロード制限を回避するため、少し遅延を入れる
    setTimeout(() => {
      exportSingleHistory(entry, format);
    }, 100 * entries.indexOf(entry));
  });
};
