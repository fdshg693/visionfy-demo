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

  /** スタートノードを探す */
  const findStartNode = useCallback((): Node => {
    const startNode = nodes.find(n => n.type === NODE_TYPE.START);
    if (!startNode) {
      throw new ValidationError(
        'Start node not found',
        'スタートノードが見つかりません。ワークフローを確認してください。'
      );
    }
    return startNode;
  }, [nodes]);

  /** 次のノードIDを探す */
  const findNextNodeId = useCallback((currentNodeId: string): string | null => {
    const edge = edges.find(e => e.source === currentNodeId);
    return edge ? edge.target : null;
  }, [edges]);

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

  /** ノードグラフをトラバースして実行 */
  const traverseAndExecuteNodes = useCallback(async (
    startNodeId: string,
    initialImage: string
  ): Promise<string> => {
    let currentNodeId: string | null = startNodeId;
    let currentImage = initialImage;

    // 無限ループ防止用に実行したノードIDを記録
    const visitedIds = new Set<string>();

    while (currentNodeId) {
      // 無限ループ防止
      if (visitedIds.has(currentNodeId)) {
        break;
      }
      visitedIds.add(currentNodeId);

      // ノードを取得
      const currentNode = nodes.find(n => n.id === currentNodeId);
      if (!currentNode) {
        break;
      }

      // エンドノードならワークフロー完了
      if (currentNode.type === NODE_TYPE.END) {
        return currentImage;
      }

      // プロセスノードなら実行
      if (currentNode.type === NODE_TYPE.PROCESS) {
        currentImage = await executeProcessNode(currentNode, currentImage);
      }

      // 次のノードへ
      currentNodeId = findNextNodeId(currentNodeId);
    }

    return currentImage;
  }, [nodes, executeProcessNode, findNextNodeId]);

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

      // スタートノードを探す
      const startNode = findStartNode();
      currentNodeId = startNode.id;

      // ノードを順次実行
      const finalImage = await traverseAndExecuteNodes(startNode.id, initialImage);

      // 最終結果を設定
      setResultImage(finalImage);

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
    findStartNode,
    traverseAndExecuteNodes,
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
