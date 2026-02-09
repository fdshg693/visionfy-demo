# Architecture

## Data Flow

### Image Processing Pipeline
1. User uploads image and configures workflow nodes in the React Flow canvas
2. `useWorkflowExecution` hook traverses the node graph (Start → Process → End)
3. For each Process node, frontend calls `/api/process-node` (Next.js API route)
4. Next.js route uses `BackendApiService` + adapter pattern to call Flask backend
5. Backend applies OpenCV/ML transformation and returns image (JPEG)
6. Result propagates to next node until End node displays final output

### AI Chat Flow
1. User sends message (with optional image) via ChatPanel
2. Frontend calls `/api/chat` (Next.js API route) with messages + workflow context
3. `ChatService` creates LangChain agent with Gemini 2.5 Pro + tools
4. Agent streams response token-by-token, invoking tools as needed
5. Frontend renders streamed markdown with tool execution indicators

Details: `docs/features/AI.md`, `frontend/lib/tools/README.md`

## Frontend Structure

**State Management**: `workflow/flowStore.tsx` provides React Context for nodes, edges, viewport, and execution status.

**Key Files**:
- `app/page.tsx` - Main workflow editor, orchestrates all panels and modals
- `app/api/process-node/route.ts` - API route proxying to Flask backend
- `app/api/chat/route.ts` - AI chat API route (Gemini streaming)
- `hooks/useWorkflowExecution.ts` - Workflow execution logic (traversal + API calls)
- `lib/backendApiService.ts` - Backend API client with adapter pattern
- `lib/backendApiAdapters.ts` - 7 function-specific request adapters (multipart/form-data)
- `lib/chatService.ts` - LangChain Gemini wrapper with tool integration
- `types/node.ts` - Type definitions for process nodes and parameters
- `types/typeGuards.ts` - Runtime type validation functions
- `types/opencv.ts` - OpenCV function configurations (UI generation, defaults)

**Node Types**:
- `startNode` - Entry point, holds uploaded image
- `processNode` - Image transformation (7 functions, see Backend Endpoints)
- `endNode` - Workflow termination, displays result

**Custom Hooks** (10 total in `hooks/`):
- `useWorkflowExecution` - Pipeline orchestration and API calls
- `useSnapshotHistory` - Snapshot CRUD (max 20 entries in localStorage)
- `useSelectedNode` - Node selection tracking for inspector popup
- `useChatThreads` - Multi-thread chat management with persistence
- `useWorkflowContext` - Stripped workflow data for AI context
- `useProcessNodeParams` - Memoized parameter extraction
- `useContextMenu` - Right-click node/edge deletion
- `useResizablePanel` - Drag-to-resize chat panel
- `useExecutionHistory` - Before/after image extraction
- `useObjectURL` - Blob URL lifecycle management

**Contexts** (`contexts/`):
- `InspectorContext` - Image upload state + execution trigger
- `ToastContext` - Global toast notifications (error/warning/info/success)

## Type Safety & Code Organization

### Type System Architecture

**Type Definitions** (`types/node.ts`):
- `ProcessNodeData` discriminated union with 7 variants:
  CLAHE, GaussianBlur, Grayscale, RemoveNoise, RestoreBrightness, RestoreContrast, ModelInference
- Parameter type mappings and `DEFAULT_NODE_PARAMS`

**Type Guards** (`types/typeGuards.ts`):
- Runtime type validation functions (`is*Data`, `assert*Data`)
- Centralized type checking, used across components, hooks, and serialization

**OpenCV Config** (`types/opencv.ts`):
- `VISIONFY_FUNCTIONS_CONFIG` - UI generation config (types, ranges, defaults)
- Used by `ProcessNodeParamInputs` for dynamic form rendering

### Workflow Persistence Layers

```
types/typeGuards.ts → (Runtime type validation)
    ↓
workflow/flowSerializer.ts → (Strip runtime data for persistence)
    ↓
workflow/flowPersistence.ts → (localStorage operations, max 20 snapshots)
```

- **flowSerializer.ts**: Strips `executionStatus`, `result`, `resultParams`, `icon`
- **flowPersistence.ts**: localStorage CRUD, snapshot versioning, legacy normalization
- **flowStore.tsx**: React Context state management with type-safe updates
- **connectionConstraints.ts**: Edge validation (linear pipeline, no branching)
- **workflowChain.ts**: Build ordered node chain for execution traversal

## Backend Endpoints

All `POST /api/*` accept `multipart/form-data` with `file` field and return `image/jpeg`.

| Method | Path                     | Description                              |
|--------|--------------------------|------------------------------------------|
| GET    | `/health`                | Health check (Cloud Run liveness)        |
| POST   | `/api/createclahe`       | CLAHE (contrast limited AHE)             |
| POST   | `/api/grayscale`         | Grayscale + optional binary threshold    |
| POST   | `/api/gaussian_blur`     | Gaussian blur with ksize/sigma           |
| POST   | `/api/remove_noise`      | Median filter (fixed 3x3 kernel)         |
| POST   | `/api/restore_contrast`  | Gamma correction                         |
| POST   | `/api/restore_brightness`| Brightness adjustment via intensity shift|
| POST   | `/api/model_inference`   | Patchcore anomaly detection + heatmap    |

Details: `docs/features/API.md`, `backend/CLAUDE.md`

## Adding New Image Processing Functions

1. Create module in `backend/src/api/{function_name}/main.py` (dataclass params + handler)
2. Add route in `backend/src/main.py`
3. Add TypeScript types in `frontend/types/node.ts` (interface + add to union)
4. Add default params to `DEFAULT_NODE_PARAMS`
5. Add adapter in `frontend/lib/backendApiAdapters.ts`
6. Add function config in `frontend/types/opencv.ts` for UI generation
7. Update AI tool description in `frontend/lib/tools/availableNodesTool.ts`

Details: `docs/features/API.md`
