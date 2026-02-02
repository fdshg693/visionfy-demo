# Architecture

## Data Flow
1. User uploads image and configures workflow nodes in the React Flow canvas
2. `useWorkflowExecution` hook traverses the node graph (Start → Process → End)
3. For each Process node, frontend calls `/api/process-node` (Next.js API route)
4. Next.js route uses `BackendApiService` to call Flask backend endpoints
5. Backend applies OpenCV transformation and returns base64-encoded image
6. Result propagates to next node until End node

## Frontend Structure

**State Management**: `workflow/flowStore.tsx` provides React Context for nodes, edges, viewport, and execution status.

**Key Files**:
- `app/page.tsx` - Main workflow editor, orchestrates components and snapshots
- `app/api/process-node/route.ts` - API route proxying to Flask backend
- `hooks/useWorkflowExecution.ts` - Workflow execution logic (traversal + API calls)
- `lib/backendApiService.ts` - Backend API client with adapter pattern
- `types/node.ts` - Type definitions for process nodes and parameters

**Node Types**:
- `startNode` - Entry point, holds uploaded image
- `processNode` - Image transformation (CLAHE, GaussianBlur, Grayscale)
- `endNode` - Workflow termination, displays result

## Backend Endpoints

| Method | Path                 | Description                          |
|--------|---------------------|--------------------------------------|
| POST   | `/api/createclane`  | CLAHE (contrast limited AHE)         |
| POST   | `/api/grayscale`    | Grayscale + optional threshold       |
| POST   | `/api/gaussian_blur`| Gaussian blur with ksize/sigma       |
| GET    | `/health`           | Health check                         |

## Adding New Image Processing Functions

1. Create new module in `backend/src/api/{function_name}/main.py`
2. Add route in `backend/src/main.py`
3. Add TypeScript types in `frontend/types/node.ts` (interface + add to union)
4. Add default params to `DEFAULT_NODE_PARAMS`
5. Add adapter in `frontend/lib/backendApiAdapters.ts` if needed
