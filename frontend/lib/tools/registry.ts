/**
 * ツールレジストリ
 * すべてのLangChainツールをここで登録・管理する
 * 新しいツールを追加する場合は、このファイルにエントリーを追加するだけでよい
 */
import type { ToolRegistryEntry } from './types';
import {
  createWorkflowContextTool,
  isWorkflowContextToolEnabled
} from './workflowContextTool';
import {
  createExecutionImagesTool,
  isExecutionImagesToolEnabled,
} from './executionImagesTool';

/**
 * 利用可能なすべてのツールのレジストリ
 * 新しいツールを追加する際は、この配列にエントリーを追加する
 */
export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  {
    name: 'get_workflow_context',
    description: 'ワークフローの現在の状態を取得',
    factory: createWorkflowContextTool,
    isEnabled: isWorkflowContextToolEnabled,
  },
  {
    name: 'get_execution_images',
    description: '直前の実行結果の元画像・処理前後画像を取得',
    factory: createExecutionImagesTool,
    isEnabled: isExecutionImagesToolEnabled,
  },
];

/**
 * コンテキストに基づいて有効なツールのインスタンスを生成
 * @param context ツール実行のためのコンテキスト
 * @returns 有効なツールの配列
 */
export function createEnabledTools(context: { nodes?: string; edges?: string }) {
  return TOOL_REGISTRY
    .filter(entry => !entry.isEnabled || entry.isEnabled(context))
    .map(entry => entry.factory(context));
}
