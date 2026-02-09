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
