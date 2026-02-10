/**
 * ワークフロー永続化に関する型定義の集約
 *
 * このモジュールは2つのワークフロー形式を統合管理：
 * 1. SimpleWorkflow - 簡易形式（ユーザー編集向け、最小限の情報）
 * 2. FlowSnapshot - 完全形式（内部保存用、全状態を保持）
 */

import type { Edge, Node, Viewport } from '@xyflow/react';
import type { SimpleWorkflow } from './simpleWorkflow';

/**
 * FlowSnapshot - React Flowの完全な状態
 * ワークフロー全体のスナップショット（ノード、エッジ、ビューポート）
 */
export type FlowSnapshot = {
  /** React Flowノード配列 */
  nodes: Node[];
  /** React Flowエッジ配列 */
  edges: Edge[];
  /** ビューポート設定（表示位置とズーム） */
  viewport: Viewport;
};

// Re-export SimpleWorkflow for convenience
export type { SimpleWorkflow };

/**
 * 永続化エントリ（スナップショット履歴の単位）
 * localStorage に保存されるワークフロー履歴の1エントリ
 */
export type FlowHistoryEntry = {
  /** 一意識別子（snapshot-{timestamp}形式） */
  id: string;
  /** 作成日時（ISO 8601形式） */
  createdAt: string;
  /** ユーザー定義の名前 */
  name: string;
  /** ワークフローのスナップショット */
  snapshot: FlowSnapshot;
};

/**
 * ストレージペイロード
 * localStorage に保存される履歴全体の構造
 */
export type PersistedFlowHistory = {
  /** 履歴エントリの配列（最大20件） */
  entries: FlowHistoryEntry[];
};

/**
 * インポート可能なワークフロー形式
 * JSONインポート時に受け付ける形式（簡易 or 完全）
 */
export type ImportableWorkflow = SimpleWorkflow | FlowSnapshot;
