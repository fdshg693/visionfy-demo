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
