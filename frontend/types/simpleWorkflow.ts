/**
 * 簡易ワークフロー形式の型定義
 *
 * 最小限の情報（関数名とパラメータ）だけでワークフローを定義できる簡易形式。
 * 省略された情報（ノード位置、エッジ、viewport等）は自動補完される。
 */

import type { ProcessNodeFunctionName, ProcessNodeParamsMap } from './node';

/**
 * 簡易プロセスノード定義
 * - functionName: 必須。処理関数名
 * - params: 省略可能。省略時はDEFAULT_NODE_PARAMSから取得
 */
export type SimpleProcessNode = {
  functionName: ProcessNodeFunctionName;
  params?: Partial<ProcessNodeParamsMap[ProcessNodeFunctionName]>;
};

/**
 * 簡易ワークフロー形式
 * - processNodes: プロセスノードの配列（START→END間に順番通り配置される）
 */
export type SimpleWorkflow = {
  processNodes: SimpleProcessNode[];
};

/**
 * 簡易ワークフロー形式の型ガード
 */
export const isSimpleWorkflow = (value: unknown): value is SimpleWorkflow => {
  if (!value || typeof value !== 'object') return false;

  const workflow = value as Partial<SimpleWorkflow>;

  // processNodesが配列であることをチェック
  if (!Array.isArray(workflow.processNodes)) return false;

  // 各要素がSimpleProcessNodeの構造を持つかチェック
  return workflow.processNodes.every(
    (node) =>
      node &&
      typeof node === 'object' &&
      typeof (node as SimpleProcessNode).functionName === 'string'
  );
};
