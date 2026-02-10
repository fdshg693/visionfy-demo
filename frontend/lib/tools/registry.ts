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
  createAvailableNodesTool,
  isAvailableNodesToolEnabled,
} from './availableNodesTool';

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
    name: 'get_available_nodes',
    description: '利用可能な処理ノード一覧を取得',
    factory: createAvailableNodesTool,
    isEnabled: isAvailableNodesToolEnabled,
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
