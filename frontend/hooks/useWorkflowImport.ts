/**
 * ワークフローインポートロジック（UI非依存）
 *
 * JSONからワークフローを読み込み、形式を自動判別して変換する
 */

import { useCallback } from 'react';
import type { FlowSnapshot } from '@/types/workflowPersistence';
import { WorkflowIOService, WorkflowImportError } from '@/lib/workflow';

// Re-export for backward compatibility
export { WorkflowImportError };

/**
 * ワークフローインポート hook
 *
 * @returns importWorkflow - JSON文字列からFlowSnapshotへの変換関数
 *
 * @example
 * const { importWorkflow } = useWorkflowImport();
 *
 * try {
 *   const snapshot = importWorkflow(jsonString);
 *   setNodes(snapshot.nodes);
 *   setEdges(snapshot.edges);
 * } catch (error) {
 *   if (error instanceof WorkflowImportError) {
 *     console.error(error.message, error.code);
 *   }
 * }
 */
export function useWorkflowImport() {
  const importWorkflow = useCallback((jsonString: string): FlowSnapshot => {
    return WorkflowIOService.importFromJSON(jsonString);
  }, []);

  return { importWorkflow };
}
