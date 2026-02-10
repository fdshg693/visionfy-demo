/**
 * Available Nodes Tool
 * AIが利用可能な処理ノードの一覧を取得するためのツール
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { DEFAULT_NODE_PARAMS, DEFAULT_NODE_ICONS, ProcessNodeFunctionName } from '@/types/processNode';
import { PROCESS_FUNCTIONS_BASE } from '@/types/processFunctionBase';
import type { ToolFactory } from './types';

/**
 * 各ノードタイプの詳細情報（AI用）
 * processFunctionBase.ts の PROCESS_FUNCTIONS_BASE から自動生成
 * この定義はchatPrompts.tsからもインポートされて使用される
 */
export const NODE_DESCRIPTIONS: Record<ProcessNodeFunctionName, {
  name: string;
  description: string;
  paramDescriptions: Record<string, string>;
}> = Object.fromEntries(
  Object.entries(PROCESS_FUNCTIONS_BASE).map(([functionName, definition]) => [
    functionName,
    {
      name: definition.displayName,
      description: definition.description,
      paramDescriptions: Object.fromEntries(
        Object.entries(definition.params).map(([paramName, paramDef]) => [
          paramName,
          paramDef.aiDescription,
        ])
      ),
    },
  ])
) as Record<ProcessNodeFunctionName, {
  name: string;
  description: string;
  paramDescriptions: Record<string, string>;
}>;

/**
 * 利用可能なノード情報をフォーマットされた文字列として生成
 */
function buildAvailableNodesInfo(): string {
  const lines: string[] = ['利用可能な処理ノード一覧:', ''];

  const functionNames = Object.keys(NODE_DESCRIPTIONS) as ProcessNodeFunctionName[];

  for (const funcName of functionNames) {
    const info = NODE_DESCRIPTIONS[funcName];
    const icon = DEFAULT_NODE_ICONS[funcName];
    const defaultParams = DEFAULT_NODE_PARAMS[funcName];

    lines.push(`## ${info.name}`);
    lines.push(`- 関数名: ${funcName}`);
    lines.push(`- アイコン: ${icon}`);
    lines.push(`- 説明: ${info.description}`);

    const paramKeys = Object.keys(info.paramDescriptions);
    if (paramKeys.length > 0) {
      lines.push('- パラメータ:');
      for (const paramKey of paramKeys) {
        const defaultValue = (defaultParams as Record<string, unknown>)[paramKey];
        const defaultStr = defaultValue !== undefined ? JSON.stringify(defaultValue) : '(なし)';
        lines.push(`  - ${paramKey}: ${info.paramDescriptions[paramKey]} [デフォルト値: ${defaultStr}]`);
      }
    } else {
      lines.push('- パラメータ: なし');
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 利用可能ノード一覧取得ツールのファクトリー
 */
export const createAvailableNodesTool: ToolFactory = () => {
  return new DynamicStructuredTool({
    name: "get_available_nodes",
    description: "利用可能な処理ノードの一覧とそのパラメータ情報を取得します。どのような画像処理が使えるか確認したい時に使用してください。",
    schema: z.object({}),
    func: async () => {
      try {
        return buildAvailableNodesInfo();
      } catch (error) {
        return `利用可能ノード情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
};

/**
 * このツールは常に有効
 */
export const isAvailableNodesToolEnabled = () => true;
