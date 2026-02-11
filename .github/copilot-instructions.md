# Project Overview

Visionfy Demo is a visual image processing workflow application. Users build node-based workflows (Start → Process nodes → End) to apply OpenCV transformations and ML-based anomaly detection to images, with results displayed in real-time. An AI chat assistant (Gemini) helps users understand and configure workflows.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, React Flow (@xyflow/react)
- **Backend**: Python Flask, OpenCV (headless), Gunicorn
- **AI Chat**: Google Gemini 2.5 Pro via LangChain
- **ML Model**: anomalib Patchcore (PyTorch) for anomaly detection
- **Infrastructure**: Google Cloud Run, Terraform, Docker multi-stage builds
- **Storage**: Google Cloud Storage (model checkpoints), Secret Manager (API keys)

## Directory Structure

```
visionfy-demo/
├── frontend/          # Next.js application
├── backend/           # Flask API server
├── terraform/         # GCP infrastructure as code
├── docs/features/     # Feature documentation (AI, API, Canvas, Snapshot)
├── ai/overview/       # Architecture overview for AI assistants
└── .claude/           # Claude Code configuration
```

## Key Features

- **Node-based Workflow**: Drag-and-drop image processing pipeline with React Flow
- **7 Processing Functions**: CLAHE, Gaussian Blur, Grayscale, Remove Noise, Restore Brightness, Restore Contrast, Model Inference (Patchcore)
- **AI Chat Assistant**: Gemini-powered chat with workflow context tools
- **Snapshot History**: Save/restore workflow configurations (max 20, localStorage)
- **Before/After Preview**: Hover over nodes to compare input vs output images

## Environment Variables

### Frontend (`frontend/.env`)
- `API_BASE_URL` - Backend URL (default: `http://localhost:8080`)
- `GEMINI_API_KEY` - Google Gemini API key (server-side only, required for `/api/chat`)
- `LOG_LEVEL` - Logging level (default: `debug` for dev, `info` for prod)

### Backend (set via Terraform in production)
- `PORT` - Server port (default: `8080`)
- `LOG_LEVEL` - Logging level (default: `INFO`)
- `FLASK_DEBUG` - Enable debug mode
- `MODEL_GCS_BUCKET` - GCS bucket for model checkpoint
- `MODEL_GCS_PATH` - GCS path to model file (e.g., `models/model.ckpt`)

Details: `terraform/terraform.tfvars.example`, `frontend/.env.example`

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

# Infrastructure

## Overview

All resources are deployed on Google Cloud Platform (GCP), managed by Terraform.
Default region: `asia-northeast1` (Tokyo).

```
                    ┌─────────────────┐
                    │  Artifact        │
                    │  Registry        │
                    │  (Docker images) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Cloud Run        │          │  Cloud Run        │
    │  visionfy-frontend│ ──API──▶ │  visionfy-backend │
    │  (Next.js, 3000)  │          │  (Flask, 8080)    │
    └──────────────────┘          └────────┬──────────┘
              │                              │
              ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Secret Manager   │          │  Cloud Storage    │
    │  (GEMINI_API_KEY) │          │  (model.ckpt)     │
    └──────────────────┘          └──────────────────┘
```

## Cloud Run Services

| Service | Port | CPU | Memory | Scaling | Image |
|---------|------|-----|--------|---------|-------|
| `visionfy-frontend` | 3000 | 1 | 512Mi | 0-5 | `frontend:latest` |
| `visionfy-backend`  | 8080 | 2 | 4Gi   | 0-3 | `backend:latest`  |

- Both services are publicly accessible (`allUsers`)
- Frontend dynamically receives `API_BASE_URL` pointing to backend Cloud Run URL
- Backend reads model from GCS on first inference request (lazy loading, cached)

## Docker

Both services use multi-stage builds to minimize image size.

**Frontend** (`frontend/Dockerfile`):
- 3 stages: deps → builder → runner
- Base: `node:22-alpine`, standalone output mode
- Non-root user (`nextjs:nodejs`)

**Backend** (`backend/Dockerfile`):
- 2 stages: builder → runtime
- Base: `python:3.12-slim`, CPU-only PyTorch wheels
- System deps: `libglib2.0-0`, `libgl1`, `libxcb1` (OpenCV headless)
- Gunicorn: 1 worker, 8 threads

## GCP Resources (Terraform)

| Resource | Purpose | Config File |
|----------|---------|-------------|
| Artifact Registry | Docker image storage | `terraform/artifact_registry.tf` |
| Cloud Run (x2) | Frontend + Backend hosting | `terraform/cloudrun.tf` |
| Cloud Storage | ML model checkpoint storage | `terraform/storage.tf` |
| Secret Manager | Gemini API key | `terraform/secrets.tf` |
| Service Accounts | IAM for each service | `terraform/iam.tf` |

### IAM

- **Backend SA** (`backend-cloudrun`): `roles/storage.objectViewer` on models bucket
- **Frontend SA** (`frontend-cloudrun`): `roles/secretmanager.secretAccessor` for Gemini key

## Deployment

Terraform manages all GCP resources. Manual Docker build + push is required before `terraform apply`.

```
1. docker build & push (backend + frontend)
2. terraform apply
3. terraform output (get service URLs)
```

Details: `terraform/DEPLOY.md`, `terraform/README.md`, `terraform/terraform.tfvars.example`

