/**
 * ワークフロー実行フック
 * 役割: ノードグラフを走査し、各ProcessNodeに対してAPIコールを実行する
 * 依存: nodes/edges/filesの状態、およびノード実行ステータス更新関数
 */
import type { Node, Edge } from '@xyflow/react';
import { useCallback, useState } from 'react';
import type { ExecutionStatus, ProcessNodeParams } from '@/types/node';
import { isProcessNodeData } from '@/types/typeGuards';
import type { WorkflowFile } from '@/types/workflow';

type UseWorkflowExecutionParams = {
  nodes: Node[];
  edges: Edge[];
  files: WorkflowFile[];
  resetNodeExecutionStatuses: () => void;
  updateNodeExecutionStatus: (nodeId: string, status: ExecutionStatus) => void;
  updateNodeExecutionResult: (nodeId: string, result: string, params: ProcessNodeParams) => void;
};

export const useWorkflowExecution = ({
  nodes,
  edges,
  files,
  resetNodeExecutionStatuses,
  updateNodeExecutionStatus,
  updateNodeExecutionResult,
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
    if (files.length === 0) {
      alert('No image uploaded.');
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
      const startNode = nodes.find(n => n.type === 'startNode');
      if (!startNode) throw new Error('Start node not found');

      currentNodeId = startNode.id;

      // 3. Traverse and Execute
      const visited = new Set<string>();
      while (currentNodeId) {
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (!currentNode) break;

        // If Process Node, Execute it
        if (currentNode.type === 'processNode') {
          // Type-safe validation of node data
          if (!isProcessNodeData(currentNode.data)) {
            throw new Error(`Invalid process node data for node ${currentNode.id}`);
          }

          updateNodeExecutionStatus(currentNode.id, 'running');

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
            throw new Error(`Node processing failed: ${response.statusText}`);
          }

          const result = await response.json();

          if (result.status === 'success' && result.result) {
            currentImage = result.result; // Update current image for next node
            // Save result and params to the node
            updateNodeExecutionResult(currentNode.id, currentImage, params);
          } else {
            throw new Error(result.message || 'Unknown error during processing');
          }
        }

        // If End Node, Set Result and Finish
        if (currentNode.type === 'endNode') {
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
      console.error('Workflow Execution Error:', error);
      if (currentNodeId) {
        updateNodeExecutionStatus(currentNodeId, 'error');
      }
      alert('Workflow failed. Check console.');
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
  ]);

  return {
    executeWorkflow,
    isProcessing,
    resultImage,
  };
};
