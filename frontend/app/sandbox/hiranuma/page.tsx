'use client';

import { NodeInspector } from '@/app/components/inspector/NodeInspector';
import { EndNode } from '@/app/components/nodes/EndNode';
import { ProcessNode } from '@/app/components/nodes/ProcessNode';
import { StartNode } from '@/app/components/nodes/StartNode';
import { DEFAULT_NODE_PARAMS, NodeData } from '@/app/types/node';
import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    addEdge,
    useEdgesState,
    useNodesState,
    type Connection,
    type Edge,
    type Node,
    type NodeTypes,
    type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useState } from 'react';

import styles from './page.module.css';

// Define custom node types
const nodeTypes: NodeTypes = {
    custom: ProcessNode,
    processNode: ProcessNode,
    startNode: StartNode,
    endNode: EndNode,
};

// Initial Nodes with new data structure
const initialNodes: Node[] = [
    {
        id: 'start',
        type: 'startNode',
        position: { x: 50, y: 150 },
        data: { label: 'Start' }
    },
    {
        id: 'clahe-demo',
        type: 'processNode',
        position: { x: 250, y: 150 },
        data: {
            label: 'CLAHE',
            functionName: 'createclahe',
            params: { clipLimit: 40.0, tileGridSize: [8, 8] },
            executionStatus: 'idle',
            icon: 'histogram'
        }
    },
    {
        id: 'end',
        type: 'endNode',
        position: { x: 500, y: 150 },
        data: { label: 'End' }
    }
];

const initialEdges: Edge[] = [];

export default function NodeEditor() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Image Upload & Result State
    const [files, setFiles] = useState<any[]>([]);
    const [resultImage, setResultImage] = useState<string | null>(null);

    // Helper to convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const updateNodeStatus = (nodeId: string, status: 'idle' | 'running' | 'success' | 'error') => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            executionStatus: status,
                        },
                    };
                }
                return node;
            })
        );
    };

    const executeWorkflow = async () => {
        if (files.length === 0) {
            alert("No image uploaded.");
            return;
        }

        setIsProcessing(true);
        setResultImage(null);

        // Reset all nodes to idle
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: { ...node.data, executionStatus: 'idle' }
            }))
        );

        try {
            // 1. Get Initial Image
            let currentImage = await fileToBase64(files[0].file);

            // 2. Find Start Node
            const startNode = nodes.find(n => n.type === 'startNode');
            if (!startNode) throw new Error("Start node not found");

            let currentNodeId: string | null = startNode.id;

            // 3. Traverse and Execute
            const visited = new Set<string>();
            while (currentNodeId) {
                const currentNode = nodes.find(n => n.id === currentNodeId);
                if (!currentNode) break;

                // Move to next node(s) logic
                // For this sequential implementation, we find the edge starting from currentNodeId

                // If Custom/Process Node, Execute it
                if (currentNode.type === 'processNode' || currentNode.type === 'custom') {
                    updateNodeStatus(currentNode.id, 'running');

                    const functionName = currentNode.data.functionName;
                    const params = currentNode.data.params;

                    // API Call
                    const response = await fetch('/api/process-node', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            functionName,
                            params,
                            inputData: currentImage
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Node processing failed: ${response.statusText}`);
                    }

                    const result = await response.json();

                    if (result.status === 'success' && result.result) {
                        currentImage = result.result; // Update current image for next node
                        updateNodeStatus(currentNode.id, 'success');
                    } else {
                        throw new Error(result.message || "Unknown error during processing");
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
            console.error("Workflow Execution Error:", error);
            alert("Workflow failed. Check console.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRunWorkflow = useCallback(() => {
        executeWorkflow();
    }, [files, nodes, edges]);

    // Filter edges to check connection constraints

    // Filter edges to check connection constraints
    const getEdgesConnectedToSource = (sourceId: string) => edges.filter(e => e.source === sourceId);
    const getEdgesConnectedToTarget = (targetId: string) => edges.filter(e => e.target === targetId);

    // OnConnect handler with constraints (Max 1 input, Max 1 output per node)
    const onConnect: OnConnect = useCallback(
        (params: Connection) => {
            // Constraint: Source node can only have 1 outgoing edge
            const sourceEdges = getEdgesConnectedToSource(params.source);
            if (sourceEdges.length >= 1) {
                alert("制約エラー: 1つのノードからの出力は1つまでです。");
                return;
            }

            // Constraint: Target node can only have 1 incoming edge
            const targetEdges = getEdgesConnectedToTarget(params.target);
            if (targetEdges.length >= 1) {
                alert("制約エラー: 1つのノードへの入力は1つまでです。");
                return;
            }

            setEdges((eds) => addEdge({ ...params, animated: true }, eds));
        },
        [edges, setEdges]
    );

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const handleUpdateNode = useCallback((nodeId: string, newData: Partial<NodeData>) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            ...newData,
                        },
                    };
                }
                return node;
            })
        );
    }, [setNodes]);

    const handleAddNode = useCallback(() => {
        const newNode: Node = {
            id: `node-${Date.now()}`,
            type: 'processNode',
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: {
                label: 'New Node',
                functionName: 'createclahe',
                params: DEFAULT_NODE_PARAMS['createclahe'],
                executionStatus: 'idle',
                icon: 'histogram',
            } as NodeData,
        };
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes]);

    const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

    return (
        <div className={styles.container}>
            {/* Main Flow Area */}
            <div className={styles.flowArea}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    colorMode="light"
                    defaultEdgeOptions={{
                        style: { stroke: '#b1b1b7', strokeWidth: 2 },
                        animated: true,
                    }}
                >
                    <Controls />
                    <MiniMap />
                    <Background color="#e5e7eb" gap={20} size={1} />
                </ReactFlow>

                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <button
                        onClick={handleAddNode}
                        className={styles.addBtn}
                    >
                        ＋ Add Node
                    </button>
                </div>
            </div>

            {/* Inspector Sidebar */}
            <div className={styles.sidebar}>
                <NodeInspector
                    selectedNode={selectedNode}
                    onUpdateNode={handleUpdateNode}
                    files={files}
                    setFiles={setFiles}
                    onRun={handleRunWorkflow}
                    resultImage={resultImage}
                />
            </div>
        </div>
    );
}
