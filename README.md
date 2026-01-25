# Visionfy Demo

This repository contains the source code for the Visionfy Demo application.

## 📂 Project Structure

```text
.
├── backend/      # Python Flask API (hosted on Cloud Run)
│   ├── src/      # Application source code
│   └── test/     # Testing scripts
└── frontend/     # Next.js Frontend (hosted on Firebase App Hosting)
```

## 🔗 Architecture & Relationships

```text
+----------------------+           +----------------------+
|   Frontend (Next.js) |   HTTPS   |   Backend (Flask)    |
| [Firebase Hosting]   +---------->+ [Cloud Run]          |
|                      |           |                      |
+----------------------+           +----------------------+
```

## 🚀 Deployment Overview

### Frontend

- **Platform**: Firebase App Hosting
- **Method**:
  - **Automatic**: Deploys automatically when changes are pushed to `main`.
  - **Manual**: `firebase deploy`
- See [FRONT_DEPLOY.md](./FRONT_DEPLOY.md) for details.

### Backend

- **Platform**: Google Cloud Run
- **Method**: Manual deployment via `gcloud` CLI.
- See [backend/DEPLOY.md](./backend/DEPLOY.md) for details.
