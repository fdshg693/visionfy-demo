/**
 * 簡易ワークフロー形式の型定義
 *
 * 最小限の情報（関数名とパラメータ）だけでワークフローを定義できる簡易形式。
 * 省略された情報（ノード位置、エッジ、viewport等）は自動補完される。
 */

import type { ProcessNodeFunctionName, ProcessNodeParamsMap } from './processNode';

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
  console.log('[isSimpleWorkflow] Checking value:', JSON.stringify(value, null, 2));

  if (!value || typeof value !== 'object') {
    console.log('[isSimpleWorkflow] Failed: value is not an object');
    return false;
  }

  const workflow = value as Partial<SimpleWorkflow>;

  // processNodesが配列であることをチェック
  if (!Array.isArray(workflow.processNodes)) {
    console.log('[isSimpleWorkflow] Failed: processNodes is not an array');
    return false;
  }

  console.log('[isSimpleWorkflow] processNodes is array with length:', workflow.processNodes.length);

  // 各要素がSimpleProcessNodeの構造を持つかチェック
  const allValid = workflow.processNodes.every((node, index) => {
    const isValid =
      node &&
      typeof node === 'object' &&
      typeof (node as SimpleProcessNode).functionName === 'string';

    if (!isValid) {
      console.log(`[isSimpleWorkflow] Failed: processNodes[${index}] is invalid:`, node);
    }

    return isValid;
  });

  console.log('[isSimpleWorkflow] All nodes valid:', allValid);
  return allValid;
};
