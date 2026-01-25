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

    // Image Upload & Result State
    const [files, setFiles] = useState<any[]>([]);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const handleRunWorkflow = useCallback(() => {
        if (files.length > 0) {
            // Mock Implementation: Just display the uploaded image as result for now
            const fileItem = files[0];
            const file = fileItem.file;
            const imageUrl = URL.createObjectURL(file);
            setResultImage(imageUrl);
        }
    }, [files]);

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
                functionName: 'cv2.GaussianBlur',
                params: DEFAULT_NODE_PARAMS['cv2.GaussianBlur'],
                executionStatus: 'idle',
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
                    colorMode="dark"
                >
                    <Controls />
                    <MiniMap />
                    <Background color="#333" gap={20} />
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
