/**
 * ワークフロー機能の型定義集約
 *
 * このモジュールは各種型定義を提供：
 * - SimpleWorkflow: 簡易形式のワークフロー定義
 * - FlowSnapshot: 完全形式のワークフロースナップショット
 * - FlowHistoryEntry: スナップショット履歴エントリ
 * - ExportFormat: エクスポート形式
 */

import type { Edge, Node, Viewport } from '@xyflow/react';
import type { ProcessNodeFunctionName, ProcessNodeParamsMap } from '@/types/processNode';

// ====================== Simple Workflow (簡易形式) ======================

/**
 * 簡易プロセスノード
 * - functionNameのみ必須
 * - paramsは省略可能（デフォルト値が使用される）
 */
export type SimpleProcessNode = {
  functionName: ProcessNodeFunctionName;
  params?: Partial<ProcessNodeParamsMap[ProcessNodeFunctionName]>;
};

/**
 * 簡易ワークフロー形式
 * - processNodes配列のみを持つ
 * - START/ENDノード、位置情報、エッジは自動生成される
 */
export type SimpleWorkflow = {
  processNodes: SimpleProcessNode[];
};

// ====================== Flow Snapshot (完全形式) ======================

/**
 * React Flowの完全なスナップショット
 * - nodes: すべてのノード（start, process, end）
 * - edges: すべてのエッジ
 * - viewport: ズームとパン状態
 */
export type FlowSnapshot = {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
};

/**
 * スナップショット履歴エントリ
 * - id: 一意な識別子
 * - createdAt: 作成日時（ISO 8601）
 * - name: ユーザー定義名
 * - snapshot: FlowSnapshot
 */
export type FlowHistoryEntry = {
  id: string;
  createdAt: string;
  name: string;
  snapshot: FlowSnapshot;
};

/**
 * 永続化された履歴データ
 * - 最大20エントリまで保持
 */
export type PersistedFlowHistory = {
  entries: FlowHistoryEntry[];
};

// ====================== Export/Import Types ======================

/**
 * エクスポート形式
 * - simple: 簡易形式（processNodesのみ）
 * - full: 完全形式（nodes, edges, viewport）
 */
export type ExportFormat = 'simple' | 'full';

/**
 * インポート可能なワークフロー
 * - SimpleWorkflow または FlowSnapshot
 */
export type ImportableWorkflow = SimpleWorkflow | FlowSnapshot;

/**
 * ワークフロー形式の識別結果
 */
export type WorkflowFormatType = 'simple' | 'full' | 'invalid';

// ====================== Validation Types ======================

/**
 * 検証結果
 */
export interface ValidationResult {
  isValid: boolean;
  format: WorkflowFormatType;
  errors: string[];
}
