# Frontend — Non-Obvious Internals

## Hydration & SSR Guard

- `page.tsx` renders `null` until `isHydrated` flips to `true` via a no-dep `useEffect`
- Reason: SSR has no `window`, so `loadFlowHistory()` returns `[]` server-side; the client would hydrate with stale initial state and React would warn about mismatched markup
- `initialHistoryEntries` uses a lazy `useState` initializer — reads localStorage exactly once, synchronously, on first client mount
- `latestSnapshot` is `initialHistoryEntries[0]` — history is always stored newest-first; index 0 is the restore target
- `FlowStoreProvider` only mounts after hydration, so its `initialNodes`/`initialEdges` are guaranteed to match localStorage

## Two-Layer Context Architecture

- **FlowStoreContext**: global mutation surface — nodes, edges, viewport, and all updaters (`updateNodeData`, `resetNodeExecutionStatuses`, etc.)
- **InspectorContext**: read/execute-only — `files`, `setFiles`, `resultImage`, `executeWorkflow`, `nodes`
- InspectorContext exists purely to avoid prop drilling through `InspectorPanel → NodeInspector → {Start,Process,End}NodeInspector`
- It re-exposes `nodes` from FlowStore so `EndNodeInspector` can iterate process nodes for execution history without additional prop chains
- `FlowStoreContext` value is wrapped in `useMemo` — any node data change (including per-node `executionStatus`) produces a new value object and re-renders every consumer

## What Is and Isn't Persisted

- Serializer (`flowSerializer`) explicitly picks only: `label`, `functionName`, `params` for process nodes; `label` for others
- Stripped on save: `executionStatus`, `result`, `resultParams`, `icon` — all runtime/transient
- `resultParams` is a separate field from `params` — stores the exact params used at execution time
- `EndNodeInspector` history uses `resultParams ?? params` — correctly shows stale execution params if the user edited params post-run without re-executing

## Snapshot Migration & Validation

- `normalizeSnapshot()` rewrites any node with `type: 'custom'` to `type: 'processNode'` — applied on both save and load for backward compat
- Validation (`isValidSnapshot`) is shallow: checks that `nodes` and `edges` are arrays and `viewport` is an object — no deep node-data checks
- Snapshot IDs are `snapshot-${Date.now()}` — collision risk if two saves happen in the same millisecond
- Max 20 entries; new snapshots prepend to the array, then slice

## Backend Adapter Layer

- All adapters use `multipart/form-data` — image as `file` blob, numeric params as string fields; this matches Flask's `request.files` + `request.form` parsing
- No fallback/default adapter exists; if `functionName` has no registered adapter `BackendApiService` throws `ProcessingError` before the fetch
- **GaussianBlur**: sends `ksizeX`, `ksizeY`, `sigmaX`, `sigmaY` as separate fields; odd-enforcement on ksize happens on the backend (even values are rounded up)
- **Grayscale**: `threshold` is omitted from FormData entirely when `enableThreshold` is `false`; backend treats its absence as "no threshold"
- `base64ToBlob` is passed as an argument to each adapter — it lives on `BackendApiService` but adapters are plain functions, so it's injected via the args object

## Two-Hop API Proxying

- Browser POSTs to `/api/process-node` (Next.js API route, runs in Node.js on the server)
- That route instantiates `BackendApiService`, which then POSTs to the Flask backend
- `base64ToBlob` and `blobToBase64` each have dual code paths: `Buffer`-based for Node.js, `atob`/`FileReader`-based for browser — because the service class is used on the server side
- Response normalization in `BackendApiService` handles two patterns: (1) direct binary image response, (2) JSON with `{ ok: true, data: { url } }` where a second fetch retrieves the actual image

## Chat API & Streaming

- `POST /api/chat` accepts `{ messages: ChatMessage[] }` — full conversation history on every request; no server-side session state
- `GEMINI_API_KEY` is read from `process.env` server-side only — never exposed to the client
- `ChatService` wraps LangChain's `ChatGoogleGenerativeAI` (`gemini-2.5-pro`); system prompt is prepended server-side from `chatPrompts.ts`, not sent by the client
- Response is a raw `text/plain` stream, not SSE — `ChatPanel` reads it directly via `ReadableStream` reader and incrementally updates the last assistant message in state
- Mid-stream errors are caught inside the `ReadableStream` `start()` and appended as plain text into the same stream; the HTTP status remains 200, so the client cannot distinguish a mid-stream failure from a successful response
- `ChatMessage` type is exported from `chatService.ts` and imported via `import type` in `ChatPanel.tsx` — `import type` erases at compile time, so LangChain dependencies in `chatService.ts` are not pulled into the client bundle

## Execution Error — Node Status Attribution

- `executeWorkflow` sets `currentNodeId = startNode.id`, then delegates to `traverseAndExecuteNodes`
- `currentNodeId` itself is never reassigned inside the traversal loop
- Catch block resolves the failed node via `ProcessingError.nodeId` first, falling back to `currentNodeId` — so API failures correctly mark the failing process node
- `ValidationError` thrown inside `executeProcessNode` (invalid node data) does not carry `nodeId`, so that case still falls back to `currentNodeId`
- Per-node RUNNING status is set correctly inside `executeProcessNode` before the API call

## Graph Topology & Traversal Edge Cases

- Connection constraints enforce exactly 1 outgoing and 1 incoming edge per node — strict linear pipeline, no branching
- Traversal uses a `Set` of visited IDs to prevent infinite loops — though the linear constraint makes cycles impossible via the UI
- If the chain ends at a process node with no outgoing edge (no End node connected), traversal exits the loop silently and returns the last processed image — no error is raised
- `initialEdges` in `flowConfig` is an empty array — the default canvas has three disconnected nodes; the user must wire them manually

## FlowCanvas Subtleties

- `fitView` is enabled on `ReactFlow` — this auto-fits the viewport on mount and **overrides** `defaultViewport`, meaning a restored snapshot's viewport position/zoom is lost on page load
- Deleting a node via context menu requires explicit edge removal — React Flow does not automatically remove edges connected to a deleted node; `FlowCanvas` filters and removes them manually
- Context menu position is calculated via `getBoundingClientRect` on the container div — canvas-internal scroll/zoom does not affect menu placement

## Memory Concerns

- `EndNodeInspector` creates a blob URL for the "Before" image inside a `useEffect` keyed on `files`; the cleanup function calls `URL.revokeObjectURL` so the URL is revoked when `files` changes or the component unmounts
- Execution results (`result` field) are base64-encoded full images stored directly in React node state — large images inflate the size of every FlowStore context value and every snapshot

## Type System Decisions

- `BaseProcessNodeData extends Record<string, unknown>` — the index signature is required to satisfy React Flow's `Node<TData>` generic constraint
- `ProcessNodeData` is a discriminated union keyed on `functionName` — enables type narrowing in switch statements
- `NodeDataUpdate` is `Partial<BaseProcessNodeData>` augmented with optional `functionName` and `params` — enables partial node updates without full replacement
- Assertion functions (`assertProcessNodeData`, etc.) throw on failure; type guards (`isProcessNodeData`, etc.) return booleans — both patterns coexist; guards are used for conditional logic, assertions for "must not fail" paths

## Error Classification Heuristics

- `categorizeError()` classifies unknown errors by scanning the message string for keywords: "network"/"fetch"/"timeout" → Network, "invalid"/"validation"/"not found" → Validation, "failed" → Processing
- "failed" is an extremely broad match — many unrelated errors will be categorized as ProcessingError
- `createErrorFromStatus()` maps 5xx to `NetworkError`, not `ProcessingError` — semantically, server errors are treated as connectivity issues
- All `AppError` subclasses call `Object.setPrototypeOf(this, Xxx.prototype)` — necessary for `instanceof` to work correctly when TypeScript compiles to ES5

## Small But Important Details

- New nodes added via the toolbar always default to `createclahe` — the function name, params, and icon are hardcoded in `handleAddNode`; there is no config-driven default
- `storageService` wraps `localStorage` — currently a thin pass-through with no additional logic, but serves as an abstraction point
- React Flow's `applyNodeChanges` / `applyEdgeChanges` handle all internal change types (position, selection, add, remove) — `onNodesChange` / `onEdgesChange` in `flowStore` simply delegate to these
- `GaussianBlurParams.ksize` has a comment noting values must be odd — frontend sends raw values; the backend rounds even values up to the next odd number
