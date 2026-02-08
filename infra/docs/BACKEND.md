# 🚀 Deployment

The backend is deployed to **Google Cloud Run**.

**Quick Deploy Command:**

```bash
# Navigate to backend directory
cd backend

# Deploy to Cloud Run
gcloud run deploy visionfy-api --source . --region asia-northeast1 --allow-unauthenticated
```