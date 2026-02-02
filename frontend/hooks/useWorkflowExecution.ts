/**
 * ワークフロー実行フック
 * 役割: ノードグラフを走査し、各ProcessNodeに対してAPIコールを実行する
 * 依存: nodes/edges/filesの状態、およびノード実行ステータス更新関数
 */
import type { Node, Edge } from '@xyflow/react';
import { useCallback, useState } from 'react';
import type { ExecutionStatus, ProcessNodeParams } from '@/types/node';
import { EXECUTION_STATUS, NODE_TYPE } from '@/constants';
import { isProcessNodeData } from '@/types/typeGuards';
import type { WorkflowFile } from '@/types/workflow';
import { ValidationError, ProcessingError, categorizeError } from '@/lib/errors';

type UseWorkflowExecutionParams = {
  nodes: Node[];
  edges: Edge[];
  files: WorkflowFile[];
  resetNodeExecutionStatuses: () => void;
  updateNodeExecutionStatus: (nodeId: string, status: ExecutionStatus) => void;
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

  const executeWorkflow = useCallback(async () => {
    // バリデーション: 画像がアップロードされているか
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
    let currentNodeId: string | null = null;

    // Reset all nodes to idle
    resetNodeExecutionStatuses();

    try {
      // 1. Get Initial Image
      let currentImage = await fileToBase64(files[0].file);

      // 2. Find Start Node
      const startNode = nodes.find(n => n.type === NODE_TYPE.START);
      if (!startNode) {
        throw new ValidationError(
          'Start node not found',
          'スタートノードが見つかりません。ワークフローを確認してください。'
        );
      }

      currentNodeId = startNode.id;

      // 3. Traverse and Execute
      const visited = new Set<string>();
      while (currentNodeId) {
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (!currentNode) break;

        // If Process Node, Execute it
        if (currentNode.type === NODE_TYPE.PROCESS) {
          // Type-safe validation of node data
          if (!isProcessNodeData(currentNode.data)) {
            throw new ValidationError(
              `Invalid process node data for node ${currentNode.id}`,
              'ノードの設定が正しくありません。',
              `Node ID: ${currentNode.id}`
            );
          }

          updateNodeExecutionStatus(currentNode.id, EXECUTION_STATUS.RUNNING);

          const { functionName, params } = currentNode.data;

          // API Call
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
              currentNode.id
            );
          }

          const result = await response.json();

          if (result.status === 'success' && result.result) {
            currentImage = result.result; // Update current image for next node
            // Save result and params to the node
            updateNodeExecutionResult(currentNode.id, currentImage, params);
          } else {
            throw new ProcessingError(
              result.message || 'Unknown error during processing',
              `処理中にエラーが発生しました (${functionName})`,
              result.message,
              currentNode.id
            );
          }
        }

        // If End Node, Set Result and Finish
        if (currentNode.type === NODE_TYPE.END) {
          setResultImage(currentImage);
          break; // End of workflow
        }

        // Find next node
        const edge = edges.find(e => e.source === currentNodeId);
        if (edge) {
          currentNodeId = edge.target;
        } else {
          currentNodeId = null; // No outgoing connection
        }

        // Safety break for infinite loops if circular (simple check)
        if (visited.has(currentNodeId || '')) break;
        if (currentNodeId) visited.add(currentNodeId);
      }
    } catch (error) {
      // エラーを分類してハンドリング
      const appError = categorizeError(error);

      // ノードのステータスを更新
      if (currentNodeId) {
        updateNodeExecutionStatus(currentNodeId, EXECUTION_STATUS.ERROR);
      }

      // エラーコールバックを呼び出し
      if (onError) {
        onError(appError);
      }

      // 技術的な詳細をコンソールに出力
      console.error('[useWorkflowExecution] Workflow execution failed:', {
        error: appError,
        nodeId: currentNodeId,
        category: appError.category,
        message: appError.message,
        technicalDetails: appError.technicalDetails,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    edges,
    fileToBase64,
    files,
    nodes,
    resetNodeExecutionStatuses,
    updateNodeExecutionResult,
    updateNodeExecutionStatus,
    onError,
  ]);

  return {
    executeWorkflow,
    isProcessing,
    resultImage,
  };
};
