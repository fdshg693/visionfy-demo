/**
 * FlowSnapshot → SimpleWorkflow 逆変換
 *
 * 完全なワークフローからprocessNodesのみを抽出：
 * - processNode以外（START/END）は除外
 * - 位置情報、エッジ、viewportは除外
 * - パラメータのみ保持
 */

import type { ProcessNodeData } from '@/types/processNode';
import { isProcessNodeData } from '@/types/typeGuards';
import type { SimpleWorkflow, SimpleProcessNode, FlowSnapshot } from '../core/types';
import { FormatConversionError } from '../core/errors';

/**
 * FlowSnapshot → SimpleWorkflow 逆変換
 *
 * 完全なワークフローから簡易形式を生成：
 * 1. type === 'processNode' のノードのみを抽出
 * 2. 各ノードから functionName と params を取得
 * 3. SimpleProcessNode配列を構築
 * 4. START/END、位置、エッジ、viewportは破棄
 *
 * @param snapshot - FlowSnapshot
 * @returns SimpleWorkflow
 * @throws {FormatConversionError} 変換に失敗した場合
 *
 * @example
 * ```typescript
 * const snapshot: FlowSnapshot = {
 *   nodes: [
 *     { id: 'start', type: 'startNode', ... },
 *     { id: 'node-1', type: 'processNode', data: { functionName: 'createclahe', params: {...} } },
 *     { id: 'node-2', type: 'processNode', data: { functionName: 'gaussianblur', params: {...} } },
 *     { id: 'end', type: 'endNode', ... }
 *   ],
 *   edges: [...],
 *   viewport: {...}
 * };
 *
 * const simple = convertSnapshotToSimpleWorkflow(snapshot);
 * // simple.processNodes: [
 * //   { functionName: 'createclahe', params: {...} },
 * //   { functionName: 'gaussianblur', params: {...} }
 * // ]
 * ```
 */
export function convertSnapshotToSimpleWorkflow(
  snapshot: FlowSnapshot
): SimpleWorkflow {
  try {
    const processNodes: SimpleProcessNode[] = snapshot.nodes
      .filter((node) => node.type === 'processNode' && isProcessNodeData(node.data))
      .map((node) => {
        const data = node.data as ProcessNodeData;
        return {
          functionName: data.functionName,
          params: data.params,
        };
      });

    return {
      processNodes,
    };
  } catch (error) {
    throw new FormatConversionError(
      `FlowSnapshot → SimpleWorkflowの変換に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
      'CONVERSION_FAILED'
    );
  }
}
