/**
 * LangChainツールの型定義
 * 新しいツールを追加する際は、ここで型を定義する
 */
import type { StructuredTool } from "@langchain/core/tools";

/**
 * ツール実行のためのコンテキスト
 * ツールがアクセス可能なデータを定義
 */
export interface ToolContext {
  /** ワークフローのノード情報（JSONシリアライズ済み） */
  nodes?: string;
  /** ワークフローのエッジ情報（JSONシリアライズ済み） */
  edges?: string;
  /** 元画像（アップロード画像）のbase64データ */
  originalImage?: string;
  /** 実行済みノードの結果（JSONシリアライズ済み: NodeResultEntry[]） */
  nodeResults?: string;
}

/**
 * 実行済みノードの結果エントリ
 * nodeResultsのJSON内の各要素の型
 */
export interface NodeResultEntry {
  nodeId: string;
  functionName: string;
  result: string;
}

/**
 * ツールファクトリー関数の型
 * コンテキストを受け取り、StructuredToolインスタンスを返す
 */
export type ToolFactory = (context: ToolContext) => StructuredTool;

/**
 * ツールレジストリのエントリー
 */
export interface ToolRegistryEntry {
  /** ツール名（一意な識別子） */
  name: string;
  /** ツールの説明 */
  description: string;
  /** ツールファクトリー関数 */
  factory: ToolFactory;
  /** ツールが有効かどうかを判定する関数（オプション） */
  isEnabled?: (context: ToolContext) => boolean;
}
