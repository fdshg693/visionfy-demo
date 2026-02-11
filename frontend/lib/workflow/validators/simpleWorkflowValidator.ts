/**
 * SimpleWorkflow形式の検証
 *
 * 簡易ワークフロー形式の構造検証を提供
 */

import type { SimpleWorkflow, SimpleProcessNode } from '../core/types';

/**
 * SimpleWorkflow形式の型ガード
 *
 * 検証内容：
 * - processNodesが配列であること
 * - 各要素がSimpleProcessNodeの構造を持つこと
 * - functionNameが文字列であること
 *
 * @param value - 検証対象
 * @returns SimpleWorkflowである場合true
 *
 * @example
 * ```typescript
 * const data = JSON.parse(jsonString);
 * if (isSimpleWorkflow(data)) {
 *   // dataはSimpleWorkflow型
 *   const snapshot = convertSimpleWorkflowToSnapshot(data);
 * }
 * ```
 */
export function isSimpleWorkflow(value: unknown): value is SimpleWorkflow {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const workflow = value as Partial<SimpleWorkflow>;

  // processNodesが配列であることをチェック
  if (!Array.isArray(workflow.processNodes)) {
    return false;
  }

  // 各要素がSimpleProcessNodeの構造を持つかチェック
  const allValid = workflow.processNodes.every((node) => {
    return (
      node &&
      typeof node === 'object' &&
      typeof (node as SimpleProcessNode).functionName === 'string'
    );
  });

  return allValid;
}

/**
 * SimpleProcessNodeの検証
 *
 * @param value - 検証対象
 * @returns SimpleProcessNodeである場合true
 */
export function isSimpleProcessNode(value: unknown): value is SimpleProcessNode {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const node = value as Partial<SimpleProcessNode>;
  return typeof node.functionName === 'string';
}
