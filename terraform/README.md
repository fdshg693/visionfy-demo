# Terraform - Visionfy Demo Infrastructure

GCPインフラをTerraformで管理します。

## 作成されるリソース

- GCPプロジェクト
- Artifact Registry（Dockerリポジトリ）
- Secret Manager（GEMINI_API_KEY）
- Cloud Run: `visionfy-backend`（Flask API, port 8080）
- Cloud Run: `visionfy-frontend`（Next.js, port 3000）
- IAM（公開アクセス + Secret権限）

## 前提条件

1. Terraform >= 1.5
2. gcloud CLI（Organization Admin + Billing Account User 権限のアカウントで認証済み）
3. Docker

## 初回セットアップ

```bash
# 1. 変数ファイルを作成
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を実際の値で編集

# 2. 初期化
terraform init

# 3. 基盤リソースを先に作成（イメージがまだないため）
terraform apply \
  -target=google_project.main \
  -target=google_project_service.apis \
  -target=google_artifact_registry_repository.docker \
  -target=google_secret_manager_secret.gemini_api_key \
  -target=google_secret_manager_secret_version.gemini_api_key \
  -target=google_service_account.frontend \
  -target=google_secret_manager_secret_iam_member.frontend_gemini_key

# 4. Docker認証
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# 5. バックエンドイメージのビルド・プッシュ
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/visionfy-demo/backend:latest ../backend
docker push asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/visionfy-demo/backend:latest

# 6. フロントエンドイメージのビルド・プッシュ
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/visionfy-demo/frontend:latest ../frontend
docker push asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/visionfy-demo/frontend:latest

# 7. 全リソースをデプロイ
terraform apply
```

## 以降のデプロイ

```bash
# イメージをビルド・プッシュ
docker build -t asia-northeast1-docker.pkg.dev/PROJECT_ID/visionfy-demo/backend:latest ../backend
docker push asia-northeast1-docker.pkg.dev/PROJECT_ID/visionfy-demo/backend:latest

docker build -t asia-northeast1-docker.pkg.dev/PROJECT_ID/visionfy-demo/frontend:latest ../frontend
docker push asia-northeast1-docker.pkg.dev/PROJECT_ID/visionfy-demo/frontend:latest

# Cloud Runを更新
terraform apply
```

## 状態管理

Terraformの状態はローカルに保存されます。
`terraform.tfstate` と `terraform.tfvars` はバージョン管理にコミットしないでください。
