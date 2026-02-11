import { DEFAULT_NODE_PARAMS, type BaseProcessNodeData, type ProcessNodeFunctionName, type ProcessNodeParams } from '@/types/processNode';
import { useMemo } from 'react';

/**
 * プロセスノードのパラメータ解決を一元化するフック
 * nodeData.params が存在すればそれを返し、なければデフォルトパラメータにフォールバックする
 */
export function useProcessNodeParams(nodeData: BaseProcessNodeData) {
  const resolvedFunctionName = useMemo(() => {
    const fn = nodeData.functionName as string | undefined;
    if (fn && fn in DEFAULT_NODE_PARAMS) {
      return fn as ProcessNodeFunctionName;
    }
    return null;
  }, [nodeData.functionName]);

  const params = useMemo(() => {
    if (nodeData.params) {
      return nodeData.params as ProcessNodeParams;
    }
    if (resolvedFunctionName) {
      return DEFAULT_NODE_PARAMS[resolvedFunctionName];
    }
    return {} as ProcessNodeParams;
  }, [nodeData.params, resolvedFunctionName]);

  return { resolvedFunctionName, params };
}
