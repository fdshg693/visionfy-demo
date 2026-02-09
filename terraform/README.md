# Terraform - Visionfy Demo Infrastructure

GCPインフラをTerraformで管理します。

## 概要

このTerraform構成は、Visionfy DemoアプリケーションをGoogle Cloud Platform（GCP）にデプロイするための完全なインフラストラクチャを定義しています。

### 作成されるリソース

| リソースタイプ | リソース名 | 説明 |
|-------------|-----------|-----|
| **Project** | `google_project.main` | GCPプロジェクト |
| **APIs** | `google_project_service.apis` | 必要なGCP APIの有効化（Cloud Run、Artifact Registry、Secret Manager、IAM） |
| **Artifact Registry** | `google_artifact_registry_repository.docker` | Dockerイメージリポジトリ |
| **Secret Manager** | `google_secret_manager_secret.gemini_api_key` | Gemini APIキーの保存 |
| **Service Account** | `google_service_account.frontend` | フロントエンドCloud Runサービスアカウント |
| **Cloud Run** | `google_cloud_run_v2_service.backend` | Flaskバックエンド（port 8080） |
| **Cloud Run** | `google_cloud_run_v2_service.frontend` | Next.jsフロントエンド（port 3000） |
| **IAM** | `google_cloud_run_v2_service_iam_member.*` | Cloud Run公開アクセス権限（allUsers） |
| **IAM** | `google_secret_manager_secret_iam_member.*` | Secret Managerアクセス権限 |

## ファイル構成

```
terraform/
├── main.tf                 # プロバイダー設定とプロジェクトリソース
├── artifact_registry.tf    # Artifact Registry設定
├── secrets.tf              # Secret Manager設定
├── iam.tf                  # サービスアカウントとIAM設定
├── cloudrun.tf             # Cloud Runサービス設定
├── variables.tf            # 変数定義
├── outputs.tf              # 出力値定義
├── terraform.tfvars.example # 変数ファイルのサンプル
├── DEPLOY.md               # 詳細なデプロイ手順
└── README.md               # このファイル
```

## クイックスタート

詳細な手順は [DEPLOY.md](./DEPLOY.md) を参照してください。

### 1. 準備

```powershell
# 変数ファイルの作成
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvars を編集（プロジェクトID、請求先アカウント、API Keyなど）

# 初期化
terraform init

# Google Cloud認証
gcloud auth application-default login
```

### 2. 基盤リソースの作成

```powershell
# PowerShellの場合（引用符が必要）
terraform apply `
  '-target=google_project.main' `
  '-target=google_project_service.apis' `
  '-target=google_artifact_registry_repository.docker' `
  '-target=google_secret_manager_secret.gemini_api_key' `
  '-target=google_secret_manager_secret_version.gemini_api_key' `
  '-target=google_service_account.frontend' `
  '-target=google_secret_manager_secret_iam_member.frontend_gemini_key'

# Bash/Zshの場合
terraform apply \
  -target=google_project.main \
  -target=google_project_service.apis \
  -target=google_artifact_registry_repository.docker \
  -target=google_secret_manager_secret.gemini_api_key \
  -target=google_secret_manager_secret_version.gemini_api_key \
  -target=google_service_account.frontend \
  -target=google_secret_manager_secret_iam_member.frontend_gemini_key
```

### 3. Dockerイメージのビルドとデプロイ

```powershell
# Docker認証
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# イメージビルド（プロジェクトルートから）
cd ..
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/visionfy-demo/backend:latest backend
docker build -t asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/visionfy-demo/frontend:latest frontend

# プッシュ
docker push asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/visionfy-demo/backend:latest
docker push asia-northeast1-docker.pkg.dev/YOUR_PROJECT_ID/visionfy-demo/frontend:latest

# Cloud Runサービスのデプロイ
cd terraform
terraform apply
```

## 主要な設定

### Cloud Run設定

**Backend:**
- CPU: 2
- メモリ: 4Gi（PyTorch + anomalib + モデル推論に必要）
- 最小インスタンス: 0
- 最大インスタンス: 3
- タイムアウト: デフォルト（300秒）
- ポート: 8080
- ヘルスチェック: `/health` (HTTP GET)
- スタートアッププローブ: 最大100秒（モデル読み込み時間を考慮）

**Frontend:**
- CPU: 1
- メモリ: 512Mi
- 最小インスタンス: 0
- 最大インスタンス: 10
- タイムアウト: デフォルト（300秒）
- ポート: 3000
- 環境変数:
  - `API_BASE_URL`: バックエンドのURL
  - `GEMINI_API_KEY`: Secret Managerから取得

### セキュリティ設定

- Cloud Runサービスは `allUsers` に公開（Ingress: INGRESS_TRAFFIC_ALL）
- フロントエンドサービスアカウントは Secret Manager へのアクセス権限を保有
- Secret Managerは自動レプリケーション設定
- 削除保護は無効（deletion_protection = false）

## コマンドリファレンス

```powershell
# 計画の確認（実行前のドライラン）
terraform plan

# 特定のリソースのみ適用
terraform apply -target=RESOURCE_TYPE.RESOURCE_NAME

# 全リソースの適用
terraform apply

# 出力値の確認
terraform output

# 状態の確認
terraform show

# リソース一覧
terraform state list

# 既存リソースのインポート
terraform import google_project.main PROJECT_ID

# 全リソースの削除
terraform destroy
```

## トラブルシューティング

詳細は [DEPLOY.md](./DEPLOY.md) のトラブルシューティングセクションを参照してください。

## 状態管理

Terraformの状態は `terraform.tfstate` ファイルにローカル保存されます。

**重要:** 以下のファイルは `.gitignore` で除外されており、バージョン管理にコミットされません：
- `terraform.tfstate`
- `terraform.tfstate.backup`
- `terraform.tfvars`
- `.terraform/`

チーム開発や本番環境では、Terraform CloudやGCS Backendを使用したリモート状態管理を推奨します。

## 更新履歴

- 2026-02-09: 初版作成、デプロイ手順の詳細化、トラブルシューティング追加
