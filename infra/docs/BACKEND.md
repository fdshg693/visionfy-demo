# 🚀 Deployment

The backend is deployed to **Google Cloud Run**.

**Quick Deploy Command:**

```bash
# Navigate to backend directory
cd backend

# Deploy to Cloud Run
gcloud run deploy visionfy-api --source . --region asia-northeast1 --allow-unauthenticated --project PROJECT_ID
```

## GCSマウント

- コンソールから簡単にボリュームを追加することは可能
- しかし、次のgcloudコマンドのデプロイで消えてしまうため不便。（次回もコンソールのデプロイの場合は、継続するため再度のマウントは不要）