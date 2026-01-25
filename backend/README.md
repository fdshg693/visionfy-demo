# Backend Directory

This directory contains the Python backend services for Visionfy.

## 📂 Directory Responsibilities

```text
backend/
├── src/          # 🏭 Production Code
│   │             Contains the Flask application, API logic, and Dockerfile.
│   │             This is the directory that gets deployed to Cloud Run.
│   │
├── test/         # 🧪 Tests
│   │             Scripts to test the API endpoints.
│   │
├── DEPLOY.md     # Deployment instructions for Cloud Run
└── DOCKER.md     # Docker usage instructions
```

## 🚀 Deployment

The backend is deployed to **Google Cloud Run**.

**Quick Deploy Command:**

```bash
# Navigate to source
cd src

# Deploy to Cloud Run
gcloud run deploy visionfy-api --source . --region asia-northeast1 --allow-unauthenticated
```

See [DEPLOY.md](DEPLOY.md) for full details.
