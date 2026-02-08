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
- `types/typeGuards.ts` - Runtime type validation functions

**Node Types**:
- `startNode` - Entry point, holds uploaded image
- `processNode` - Image transformation (CLAHE, GaussianBlur, Grayscale)
- `endNode` - Workflow termination, displays result

## Type Safety & Code Organization

### Type System Architecture

**Type Definitions** (`types/node.ts`):
- Core type definitions for all node data structures
- Union types for ProcessNodeData variants (CLAHE, GaussianBlur, Grayscale)
- Parameter type mappings and default values

**Type Guards** (`types/typeGuards.ts`):
- Runtime type validation functions
- Centralized type checking logic to avoid duplication
- Used across components, hooks, and serialization

### Workflow Persistence Layers

**Serialization** (`workflow/flowSerializer.ts`):
- **責務**: Transform runtime node data to persistable format
- Strips execution-specific data (status, results, icons)
- Preserves only essential node configuration
- **依存**: Uses type guards from `types/typeGuards.ts`

**Persistence** (`workflow/flowPersistence.ts`):
- **責務**: Handle localStorage operations and versioning
- Manages snapshot history (save, load, delete)
- Validates persisted data structure
- **依存**: Uses FlowSnapshot type from `flowSerializer.ts`

**State Management** (`workflow/flowStore.tsx`):
- **責務**: Manage runtime workflow state in React Context
- Handles node/edge updates with type-safe validation
- Provides execution status updates
- **依存**: Uses type guards for runtime validation

### Separation of Concerns

```
Type Validation Flow:
types/typeGuards.ts → (型検証ロジック)
    ↓
workflow/flowSerializer.ts → (シリアライゼーション)
    ↓
workflow/flowPersistence.ts → (永続化)
```

**Why this separation?**
1. **Single Responsibility**: Each file has one clear purpose
2. **Reusability**: Type guards are used across multiple modules
3. **Maintainability**: Type validation logic is centralized, not duplicated
4. **Type Safety**: Runtime validation prevents invalid data from propagating

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
