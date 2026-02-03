/**
 * ワークフロー実行フック
 * 役割: ノードグラフを走査し、各ProcessNodeに対してAPIコールを実行する
 * 依存: nodes/edges/filesの状態、およびノード実行ステータス更新関数
 */
import type { Node, Edge } from '@xyflow/react';
import { useCallback, useState } from 'react';
import type { ProcessNodeParams } from '@/types/node';
import type { ExecutionStatusValue } from '@/constants/index';
import { EXECUTION_STATUS, NODE_TYPE } from '@/constants/index';
import { isProcessNodeData } from '@/types/typeGuards';
import type { WorkflowFile } from '@/types/workflow';
import { ValidationError, ProcessingError, categorizeError } from '@/lib/errors';
import { buildNodeChain } from '@/workflow/workflowChain';

type UseWorkflowExecutionParams = {
  nodes: Node[];
  edges: Edge[];
  files: WorkflowFile[];
  resetNodeExecutionStatuses: () => void;
  updateNodeExecutionStatus: (nodeId: string, status: ExecutionStatusValue) => void;
  updateNodeExecutionResult: (nodeId: string, result: string, params: ProcessNodeParams) => void;
  onError?: (error: unknown) => void;
};

export const useWorkflowExecution = ({
  nodes,
  edges,
  files,
  resetNodeExecutionStatuses,
  updateNodeExecutionStatus,
  updateNodeExecutionResult,
  onError,
}: UseWorkflowExecutionParams) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }, []);

  /** プロセスノードを実行 */
  const executeProcessNode = useCallback(async (
    node: Node,
    currentImage: string
  ): Promise<string> => {
    // データ検証
    if (!isProcessNodeData(node.data)) {
      throw new ValidationError(
        `Invalid process node data for node ${node.id}`,
        'ノードの設定が正しくありません。',
        `Node ID: ${node.id}`
      );
    }

    updateNodeExecutionStatus(node.id, EXECUTION_STATUS.RUNNING);

    const { functionName, params } = node.data;

    // API呼び出し
    const response = await fetch('/api/process-node', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        functionName,
        params,
        inputData: currentImage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ProcessingError(
        `Node processing failed: ${response.statusText}`,
        `ノード処理に失敗しました (${functionName})`,
        errorText,
        node.id
      );
    }

    const result = await response.json();

    if (result.status !== 'success' || !result.result) {
      throw new ProcessingError(
        result.message || 'Unknown error during processing',
        `処理中にエラーが発生しました (${functionName})`,
        result.message,
        node.id
      );
    }

    // 結果を保存
    updateNodeExecutionResult(node.id, result.result, params);
    return result.result;
  }, [updateNodeExecutionStatus, updateNodeExecutionResult]);

  /** ワークフローを実行 */
  const executeWorkflow = useCallback(async () => {
    // 早期return: 画像未アップロード
    if (files.length === 0) {
      const error = new ValidationError(
        'No image uploaded',
        '画像がアップロードされていません。'
      );
      if (onError) onError(error);
      return;
    }

    setIsProcessing(true);
    setResultImage(null);
    resetNodeExecutionStatuses();

    let currentNodeId: string | null = null;

    try {
      // 初期画像を取得
      const initialImage = await fileToBase64(files[0].file);

      // 実行フローを事前に確定する
      const chain = buildNodeChain(nodes, edges);
      if (chain.length === 0 || chain[0].type !== NODE_TYPE.START) {
        throw new ValidationError(
          'Start node not found',
          'スタートノードが見つかりません。ワークフローを確認してください。'
        );
      }

      // 確定した順序で実行していく
      let currentImage = initialImage;
      for (const node of chain) {
        currentNodeId = node.id;
        if (node.type === NODE_TYPE.PROCESS) {
          currentImage = await executeProcessNode(node, currentImage);
        }
      }

      // 最終結果を設定
      setResultImage(currentImage);

    } catch (error) {
      // エラーを分類してハンドリング
      const appError = categorizeError(error);

      // ノードのステータスを更新（ProcessingErrorにnodeIdがある場合はそちらを優先）
      const failedNodeId = appError instanceof ProcessingError && appError.nodeId
        ? appError.nodeId
        : currentNodeId;
      if (failedNodeId) {
        updateNodeExecutionStatus(failedNodeId, EXECUTION_STATUS.ERROR);
      }

      // エラーコールバックを呼び出し
      if (onError) {
        onError(appError);
      }

      // 技術的な詳細をコンソールに出力
      console.error('[useWorkflowExecution] Workflow execution failed:', {
        error: appError,
        nodeId: failedNodeId,
        category: appError.category,
        message: appError.message,
        technicalDetails: appError.technicalDetails,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    files,
    fileToBase64,
    nodes,
    edges,
    executeProcessNode,
    resetNodeExecutionStatuses,
    updateNodeExecutionStatus,
    onError,
  ]);

  return {
    executeWorkflow,
    isProcessing,
    resultImage,
  };
};
