/**
 * ワークフローインポートロジック（UI非依存）
 *
 * JSONからワークフローを読み込み、形式を自動判別して変換する
 */

import { useCallback } from 'react';
import type { FlowSnapshot } from '@/types/workflowPersistence';
import { identifyWorkflowFormat } from '@/workflow/workflowValidator';
import { normalizeSnapshot, convertSimpleWorkflowToSnapshot } from '@/workflow/workflowConverter';
import type { SimpleWorkflow } from '@/types/simpleWorkflow';

/**
 * ワークフローインポートエラー
 */
export class WorkflowImportError extends Error {
  constructor(
    message: string,
    public readonly code: 'PARSE_ERROR' | 'INVALID_FORMAT'
  ) {
    super(message);
    this.name = 'WorkflowImportError';
  }
}

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
    // Step 1: Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new WorkflowImportError(
        '無効なJSON形式です。構文を確認してください。',
        'PARSE_ERROR'
      );
    }

    // Step 2: Identify format and convert
    const format = identifyWorkflowFormat(parsed);

    switch (format) {
      case 'simple':
        // Simple workflow → Full snapshot
        return convertSimpleWorkflowToSnapshot(parsed as SimpleWorkflow);

      case 'full':
        // Full snapshot → Normalize for backward compatibility
        return normalizeSnapshot(parsed as FlowSnapshot);

      case 'invalid':
      default:
        throw new WorkflowImportError(
          '無効なワークフロー構造です。以下のいずれかの形式が必要です:\n' +
          '簡易形式: { "processNodes": [{ "functionName": "...", "params": {...} }] }\n' +
          '完全形式: { "nodes": [...], "edges": [...], "viewport": {...} }',
          'INVALID_FORMAT'
        );
    }
  }, []);

  return { importWorkflow };
}
