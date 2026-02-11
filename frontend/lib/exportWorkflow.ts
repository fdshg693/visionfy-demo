/**
 * ワークフローエクスポート機能
 *
 * 役割: スナップショット履歴をJSON形式でエクスポート
 * 対応形式: SimpleWorkflow（簡易形式）/ FlowSnapshot（完全形式）
 */

import type { FlowHistoryEntry } from '@/types/workflowPersistence';
import { WorkflowIOService, type ExportFormat } from '@/lib/workflow';

// Re-export for backward compatibility
export type { ExportFormat };

/**
 * 単一の履歴エントリをエクスポート
 */
export const exportSingleHistory = (entry: FlowHistoryEntry, format: ExportFormat) => {
  WorkflowIOService.exportToFile(entry, format);
};

/**
 * 複数の履歴エントリを一括エクスポート
 */
export const exportMultipleHistories = (entries: FlowHistoryEntry[], format: ExportFormat) => {
  WorkflowIOService.exportMultipleToFiles(entries, format);
};
