/**
 * ノードタイプの定数定義
 * React Flowで使用されるカスタムノードタイプ
 */
export const NODE_TYPE = {
  START: 'startNode',
  PROCESS: 'processNode',
  END: 'endNode',
} as const;

export type NodeTypeValue = (typeof NODE_TYPE)[keyof typeof NODE_TYPE];
