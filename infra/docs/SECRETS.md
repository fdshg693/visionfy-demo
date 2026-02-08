# 秘密値の管理

フロントのNEXTJSにおいて秘密を保持しており、ローカルでは`.env`ファイルで管理していますが、デプロイ時にはGCPのSecret Managerを利用しています。

## 以下のようにして、GCP_SA_KEYを作成

```bash
PROJECT_ID="project-id-your"
SA_NAME="gh-deployer"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create "$SA_NAME" --project "$PROJECT_ID"
```