/**
 * ワークフロー状態管理ストア
 * 役割: ノード、エッジ、ビューポート、実行ステータスをReact Contextで一元管理
 * 依存: @xyflow/reactのNode/Edge型定義
 */
import type {
  NodeDataUpdate,
  ProcessNodeParams,
  BaseProcessNodeData,
} from '@/types/node';
import type { ExecutionStatusValue } from '@/constants/index';
import { EXECUTION_STATUS } from '@/constants/index';
import { isBaseProcessNodeData } from '@/types/typeGuards';
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Viewport,
} from '@xyflow/react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type FlowStoreValue = {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setViewport: (viewport: Viewport) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  updateNodeData: (nodeId: string, newData: NodeDataUpdate) => void;
  resetNodeExecutionStatuses: () => void;
  updateNodeExecutionStatus: (nodeId: string, status: ExecutionStatusValue) => void;
  updateNodeExecutionResult: (nodeId: string, result: string, params: ProcessNodeParams) => void;
};

type FlowStoreProviderProps = {
  children: ReactNode;
  initialNodes: Node[];
  initialEdges: Edge[];
  initialViewport?: Viewport;
};

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

const FlowStoreContext = createContext<FlowStoreValue | null>(null);

export function FlowStoreProvider({
  children,
  initialNodes,
  initialEdges,
  initialViewport = DEFAULT_VIEWPORT,
}: FlowStoreProviderProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [viewport, setViewport] = useState<Viewport>(initialViewport);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: NodeDataUpdate) => {
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== nodeId) return node;

        // Type-safe data merging with runtime validation
        if (!isBaseProcessNodeData(node.data)) {
          console.warn(`Node ${nodeId} has invalid data structure`);
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            ...newData,
          } as BaseProcessNodeData,
        };
      })
    );
  }, []);

  const resetNodeExecutionStatuses = useCallback(() => {
    setNodes((current) =>
      current.map((node) => {
        if (!isBaseProcessNodeData(node.data)) {
          return node;
        }

        return {
          ...node,
          data: {
            ...node.data,
            executionStatus: EXECUTION_STATUS.IDLE as ExecutionStatusValue,
            result: undefined,
            resultParams: undefined,
          },
        };
      })
    );
  }, []);

  const updateNodeExecutionStatus = useCallback(
    (nodeId: string, status: ExecutionStatusValue) => {
      updateNodeData(nodeId, { executionStatus: status });
    },
    [updateNodeData]
  );

  const updateNodeExecutionResult = useCallback(
    (nodeId: string, result: string, params: ProcessNodeParams) => {
      updateNodeData(nodeId, {
        executionStatus: EXECUTION_STATUS.SUCCESS,
        result,
        resultParams: params as unknown as Record<string, unknown>,
      });
    },
    [updateNodeData]
  );

  const value = useMemo(
    () => ({
      nodes,
      edges,
      viewport,
      setNodes,
      setEdges,
      setViewport,
      onNodesChange,
      onEdgesChange,
      updateNodeData,
      resetNodeExecutionStatuses,
      updateNodeExecutionStatus,
      updateNodeExecutionResult,
    }),
    [
      nodes,
      edges,
      viewport,
      onNodesChange,
      onEdgesChange,
      updateNodeData,
      resetNodeExecutionStatuses,
      updateNodeExecutionStatus,
      updateNodeExecutionResult,
    ]
  );

  return (
    <FlowStoreContext.Provider value={value}>
      {children}
    </FlowStoreContext.Provider>
  );
}

export function useFlowStore() {
  const context = useContext(FlowStoreContext);
  if (!context) {
    throw new Error('useFlowStore must be used within FlowStoreProvider');
  }
  return context;
}
