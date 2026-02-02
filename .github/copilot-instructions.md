# Visionfy Demo — Copilot Instructions

## Big picture

- Two services: Next.js frontend in frontend/ (Firebase App Hosting) and Flask backend in backend/src/ (Cloud Run). See README.md.
- Frontend App Router entry and orchestration live in frontend/app/page.tsx; UI components in frontend/app/components/.
- Backend entrypoint is backend/src/main.py; API routes are implemented under backend/src/api/.

## Core data flow (workflow execution)

- UI builds a node graph (Start → Process → End). Execution is handled by the hook in frontend/hooks/useWorkflowExecution.ts.
- The hook calls the Next.js route frontend/app/api/process-node/route.ts, which proxies to BackendApiService.
- BackendApiService (frontend/lib/backendApiService.ts) selects a request adapter from frontend/lib/backendApiAdapters.ts to match backend expectations.
- Adapters send FormData with image files; keep backend route names (note the typo: /api/createclane) in sync with adapters.

## Key domain structure

- Node types/params and defaults are defined in frontend/types/; constants in frontend/constants/.
- Workflow state, persistence, and snapshots live in frontend/workflow/ and use local storage via storageService.
- Inspector UIs are per node type under frontend/app/components/inspector/inspectors/.

## Dev workflows

- Frontend (pnpm): pnpm install, pnpm dev, pnpm lint (see frontend/package.json).
- Backend: pip install -r backend/requirements.txt, then python backend/src/main.py (listens on 0.0.0.0:8080).
- Optional Docker local run: see backend/DOCKER.md.
- Static backend test UI: run python -m http.server 8000 from backend/test (see backend/src/static/README.md).

## Integration points & conventions

- Frontend-to-backend URL is controlled by API_BASE_URL; default is http://localhost:8080 (frontend/lib/backendApiService.ts).
- If you add a new ProcessNode function, update:
  - frontend/types/node.ts (function names/params)
  - frontend/lib/backendApiAdapters.ts (request formatting)
  - backend/src/api/\* and backend/src/main.py (route wiring)
- For grayscale and gaussian blur, adapters expect specific parameter names (tileGridSize, threshold, ksize, sigma) — check backendApiAdapters before changing payloads.
