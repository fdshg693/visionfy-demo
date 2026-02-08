# 秘密値の管理

フロントのNEXTJSにおいて秘密を保持しており、ローカルでは`.env`ファイルで管理していますが、デプロイ時にはGCPのSecret Managerを利用しています。

## 以下のようにして、GCP_SA_KEYを作成(backend)

```powershell
$REGION="asia-northeast1"
$PROJECT_ID="project-id-your"
$SA_NAME="gh-deployer"
$SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create "$SA_NAME" --project "$PROJECT_ID"
```

## モデル推論のために、GCSを読み取り可能にする
```powershell
$SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" `
  --member="serviceAccount:${SA_EMAIL}" `
  --role="roles/storage.objectViewer"
```

## GCSを作成
```powershell
$BUCKET="visionfy-model-bucket"
gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${BUCKET}"
```


## 以下のようにして、Secret Managerの秘密値へのアクセスを付与(frontend)
```powershell
# backendsの一覧を確認
firebase apphosting:backends:list
# secretsの一覧へのアクセスを付与
firebase apphosting:secrets:grantaccess visionfy-gemini-api-key --project your-project --backend your-backend
firebase apphosting:secrets:grantaccess visionfy-api-base-url   --project your-project --backend your-backend
# 結果を確認
gcloud secrets get-iam-policy visionfy-gemini-api-key
gcloud secrets get-iam-policy visionfy-api-base-url
```
