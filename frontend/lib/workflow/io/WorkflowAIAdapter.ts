/**
 * Workflow AI Adapter
 *
 * AI機能とワークフローI/Oの連携を提供
 * - AI生成ワークフローのセッション管理
 * - ワークフローデータの保存・取得
 * - [WORKFLOW_SESSION:id]マーカーによるハンドオフ
 */

import type { SimpleWorkflow, FlowSnapshot } from '../core/types';
import { WorkflowIOService } from './WorkflowIOService';

/**
 * セッションAPIのレスポンス型
 */
interface SessionResponse {
  success: boolean;
  workflowData?: SimpleWorkflow;
  error?: string;
}

/**
 * Workflow AI Adapter Class
 *
 * AI生成ワークフローとクライアントUIの連携を担当
 */
export class WorkflowAIAdapter {
  /**
   * AI生成ワークフローをセッションストアに登録
   *
   * このメソッドは主にgenerateWorkflowToolから呼び出される
   * サーバーサイド（AIツール実行環境）で使用される
   *
   * @param simpleWorkflow - AI生成のSimpleWorkflow
   * @param sessionId - セッションID（UUIDなど）
   * @returns セッションID
   * @throws エラー時は例外をスロー
   *
   * @example
   * ```typescript
   * // generateWorkflowTool内部での使用例
   * const sessionId = crypto.randomUUID();
   * await WorkflowAIAdapter.registerSession(simpleWorkflow, sessionId);
   * return `[WORKFLOW_SESSION:${sessionId}]`;
   * ```
   */
  static async registerSession(
    simpleWorkflow: SimpleWorkflow,
    sessionId: string
  ): Promise<string> {
    const port = process.env.PORT || 3000;
    const apiUrl = `http://localhost:${port}/api/apply-workflow`;

    console.log('[WorkflowAIAdapter] Registering session:', sessionId);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowData: simpleWorkflow, sessionId }),
    });

    if (!response.ok) {
      throw new Error(`セッション登録に失敗しました (status: ${response.status})`);
    }

    return sessionId;
  }

  /**
   * セッションからワークフローを取得
   *
   * このメソッドは主にChatPanelから呼び出される
   * クライアントサイド（UI）で使用される
   *
   * @param sessionId - セッションID
   * @returns SimpleWorkflow（存在しない場合はnull）
   *
   * @example
   * ```typescript
   * // ChatPanel内部での使用例
   * const match = content.match(/\[WORKFLOW_SESSION:([^\]]+)\]/);
   * if (match) {
   *   const sessionId = match[1];
   *   const workflow = await WorkflowAIAdapter.retrieveFromSession(sessionId);
   *   if (workflow) {
   *     const snapshot = WorkflowIOService.toFlowSnapshot(workflow);
   *     setNodes(snapshot.nodes);
   *     setEdges(snapshot.edges);
   *   }
   * }
   * ```
   */
  static async retrieveFromSession(sessionId: string): Promise<SimpleWorkflow | null> {
    try {
      console.log('[WorkflowAIAdapter] Retrieving session:', sessionId);

      const response = await fetch(`/api/apply-workflow?sessionId=${sessionId}`);

      if (!response.ok) {
        console.error(
          '[WorkflowAIAdapter] セッション取得失敗:',
          response.status
        );
        return null;
      }

      const data: SessionResponse = await response.json();

      if (!data.success || !data.workflowData) {
        console.error('[WorkflowAIAdapter] ワークフローデータが存在しません');
        return null;
      }

      return data.workflowData;
    } catch (error) {
      console.error('[WorkflowAIAdapter] セッション取得エラー:', error);
      return null;
    }
  }

  /**
   * AI生成ワークフローを適用（セッション登録 + スナップショット変換）
   *
   * サーバーサイド専用メソッド
   * generateWorkflowToolの実装を簡素化するためのヘルパー
   *
   * @param simpleWorkflow - AI生成のSimpleWorkflow
   * @returns セッションIDとFlowSnapshot
   *
   * @example
   * ```typescript
   * // generateWorkflowTool内部での使用例
   * const { sessionId, snapshot } = await WorkflowAIAdapter.applyAIWorkflow(input);
   * return `ワークフローを生成しました。[WORKFLOW_SESSION:${sessionId}]`;
   * ```
   */
  static async applyAIWorkflow(simpleWorkflow: SimpleWorkflow): Promise<{
    sessionId: string;
    snapshot: FlowSnapshot;
  }> {
    const sessionId = crypto.randomUUID();
    await this.registerSession(simpleWorkflow, sessionId);

    const snapshot = WorkflowIOService.toFlowSnapshot(simpleWorkflow);

    return { sessionId, snapshot };
  }

  /**
   * ストリーム内のワークフローセッションマーカーを検出
   *
   * @param content - ストリーム内容
   * @returns セッションIDの配列
   *
   * @example
   * ```typescript
   * const content = "ワークフローを生成しました。[WORKFLOW_SESSION:abc-123]";
   * const sessionIds = WorkflowAIAdapter.extractSessionIds(content);
   * // sessionIds: ['abc-123']
   * ```
   */
  static extractSessionIds(content: string): string[] {
    const matches = content.matchAll(/\[WORKFLOW_SESSION:([^\]]+)\]/g);
    return Array.from(matches, (match) => match[1]);
  }
}
