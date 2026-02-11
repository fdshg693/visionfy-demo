/**
 * Workflow I/O Service
 *
 * ワークフローのインポート・エクスポートを統一的に提供
 * - JSON形式でのインポート・エクスポート
 * - ファイルダウンロード
 * - 形式変換（SimpleWorkflow ↔ FlowSnapshot）
 */

import type { Node, Edge, Viewport } from '@xyflow/react';
import type {
  SimpleWorkflow,
  FlowSnapshot,
  FlowHistoryEntry,
  ExportFormat,
} from '../core/types';
import { WorkflowImportError, WorkflowExportError } from '../core/errors';
import {
  convertSimpleWorkflowToSnapshot,
  convertSnapshotToSimpleWorkflow,
} from '../converters';
import { identifyWorkflowFormat } from '../validators';
import { normalizeSnapshot, stripRuntimeNodeData } from './utils';
import { formatSnapshotDate } from '@/lib/formatDate';

/**
 * Workflow I/O Service Class
 *
 * すべてのワークフローインポート・エクスポート操作を提供
 */
export class WorkflowIOService {
  // ====================== Import Operations ======================

  /**
   * JSON文字列からFlowSnapshotを生成
   *
   * @param jsonString - JSON文字列
   * @returns FlowSnapshot
   * @throws {WorkflowImportError} パース失敗、または無効な形式
   *
   * @example
   * ```typescript
   * try {
   *   const snapshot = WorkflowIOService.importFromJSON(jsonString);
   *   setNodes(snapshot.nodes);
   *   setEdges(snapshot.edges);
   * } catch (error) {
   *   if (error instanceof WorkflowImportError) {
   *     console.error(error.message, error.code);
   *   }
   * }
   * ```
   */
  static importFromJSON(jsonString: string): FlowSnapshot {
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

    // Step 2: Convert to FlowSnapshot
    return this.importFromObject(parsed);
  }

  /**
   * オブジェクトからFlowSnapshotを生成
   *
   * @param data - パース済みデータ
   * @returns FlowSnapshot
   * @throws {WorkflowImportError} 無効な形式
   */
  static importFromObject(data: unknown): FlowSnapshot {
    const format = identifyWorkflowFormat(data);

    switch (format) {
      case 'simple':
        // Simple workflow → Full snapshot
        return convertSimpleWorkflowToSnapshot(data as SimpleWorkflow);

      case 'full':
        // Full snapshot → Normalize for backward compatibility
        return normalizeSnapshot(data as FlowSnapshot);

      case 'invalid':
      default:
        throw new WorkflowImportError(
          '無効なワークフロー構造です。以下のいずれかの形式が必要です:\n' +
            '簡易形式: { "processNodes": [{ "functionName": "...", "params": {...} }] }\n' +
            '完全形式: { "nodes": [...], "edges": [...], "viewport": {...} }',
          'INVALID_FORMAT'
        );
    }
  }

  // ====================== Export Operations ======================

  /**
   * FlowSnapshotをJSON文字列に変換
   *
   * @param snapshot - FlowSnapshot
   * @param format - エクスポート形式
   * @returns JSON文字列
   */
  static exportToJSON(snapshot: FlowSnapshot, format: ExportFormat): string {
    const data = this.convertSnapshot(snapshot, format);
    return JSON.stringify(data, null, 2);
  }

  /**
   * 単一の履歴エントリをファイルとしてエクスポート
   *
   * @param entry - FlowHistoryEntry
   * @param format - エクスポート形式
   * @throws {WorkflowExportError} ダウンロード失敗
   */
  static exportToFile(entry: FlowHistoryEntry, format: ExportFormat): void {
    try {
      const data = this.convertSnapshot(entry.snapshot, format);
      const filename = this.createFilename(entry, format);
      this.downloadJSON(data, filename);
    } catch (error) {
      throw new WorkflowExportError(
        `ファイルエクスポートに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
        'DOWNLOAD_ERROR'
      );
    }
  }

  /**
   * 複数の履歴エントリを一括エクスポート
   *
   * @param entries - FlowHistoryEntry配列
   * @param format - エクスポート形式
   */
  static exportMultipleToFiles(
    entries: FlowHistoryEntry[],
    format: ExportFormat
  ): void {
    entries.forEach((entry, index) => {
      // ブラウザのダウンロード制限を回避するため、少し遅延を入れる
      setTimeout(() => {
        this.exportToFile(entry, format);
      }, 100 * index);
    });
  }

  // ====================== Format Conversion ======================

  /**
   * FlowSnapshotをSimpleWorkflowに変換
   *
   * @param snapshot - FlowSnapshot
   * @returns SimpleWorkflow
   */
  static toSimpleWorkflow(snapshot: FlowSnapshot): SimpleWorkflow {
    return convertSnapshotToSimpleWorkflow(snapshot);
  }

  /**
   * SimpleWorkflowをFlowSnapshotに変換
   *
   * @param workflow - SimpleWorkflow
   * @returns FlowSnapshot
   */
  static toFlowSnapshot(workflow: SimpleWorkflow): FlowSnapshot {
    return convertSimpleWorkflowToSnapshot(workflow);
  }

  /**
   * FlowSnapshotを生成（ランタイムデータ除去）
   *
   * @param nodes - ノード配列
   * @param edges - エッジ配列
   * @param viewport - viewport
   * @returns FlowSnapshot
   */
  static createFlowSnapshot(
    nodes: Node[],
    edges: Edge[],
    viewport: Viewport
  ): FlowSnapshot {
    return {
      nodes: nodes.map(stripRuntimeNodeData),
      edges,
      viewport,
    };
  }

  // ====================== AI Integration ======================

  /**
   * AI生成ワークフローからFlowSnapshotを作成
   *
   * @param simpleWorkflow - SimpleWorkflow
   * @returns FlowSnapshot
   */
  static createFromAIGeneration(simpleWorkflow: SimpleWorkflow): FlowSnapshot {
    return this.toFlowSnapshot(simpleWorkflow);
  }

  // ====================== Private Helpers ======================

  /**
   * スナップショットを指定形式に変換
   *
   * @param snapshot - FlowSnapshot
   * @param format - エクスポート形式
   * @returns SimpleWorkflow | FlowSnapshot
   */
  private static convertSnapshot(
    snapshot: FlowSnapshot,
    format: ExportFormat
  ): SimpleWorkflow | FlowSnapshot {
    if (format === 'simple') {
      return this.toSimpleWorkflow(snapshot);
    }
    return snapshot;
  }

  /**
   * エクスポート用のファイル名を生成
   *
   * @param entry - FlowHistoryEntry
   * @param format - エクスポート形式
   * @returns ファイル名
   */
  private static createFilename(
    entry: FlowHistoryEntry,
    format: ExportFormat
  ): string {
    const date = formatSnapshotDate(entry.createdAt);
    const formatSuffix = format === 'simple' ? 'simple' : 'full';
    const safeName = entry.name.replace(
      /[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g,
      '_'
    );
    return `${safeName}_${date}_${formatSuffix}.json`;
  }

  /**
   * JSONファイルとしてダウンロード
   *
   * @param data - データ
   * @param filename - ファイル名
   */
  private static downloadJSON(data: unknown, filename: string): void {
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
  }
}
