/**
 * 実行ステータスの定数定義
 * ワークフロー実行時のノードの状態を表す
 */
export const EXECUTION_STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type ExecutionStatusValue = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];
