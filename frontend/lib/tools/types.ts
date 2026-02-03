/**
 * LangChainツールの型定義
 * 新しいツールを追加する際は、ここで型を定義する
 */
import { z } from "zod";
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
