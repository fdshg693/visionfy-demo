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
├── main.tf                          # プロバイダー設定とプロジェクトリソース
├── artifact_registry.tf             # Artifact Registry設定
├── secrets.tf                       # Secret Manager設定
├── iam.tf                           # サービスアカウントとIAM設定
├── cloudrun.tf                      # Cloud Runサービス設定
├── storage.tf                       # Cloud Storage (モデル) 設定
├── variables.tf                     # 変数定義
├── outputs.tf                       # 出力値定義
├── environments/                    # 環境別の変数ファイル
│   ├── dev.tfvars.example           #   dev環境のテンプレート（コミット対象）
│   ├── prod.tfvars.example          #   prod環境のテンプレート（コミット対象）
│   ├── dev.tfvars                   #   実値（gitignore、シークレット含む）
│   └── prod.tfvars                  #   実値（gitignore、シークレット含む）
├── states/                          # 環境別のtfstate（中身はgitignore）
│   ├── dev.tfstate
│   └── prod.tfstate
├── DEPLOY.md                        # 詳細なデプロイ手順
└── README.md                        # このファイル
```

## 環境分離方針

dev / prod は **同一の `.tf` ファイル群** を共有し、以下を環境ごとに分けます:

| 種別 | パス | 切替方法 |
|------|------|---------|
| 変数値 | `environments/<env>.tfvars` | `-var-file=environments/<env>.tfvars` |
| state  | `states/<env>.tfstate`     | `-state=states/<env>.tfstate`        |

`<env>` は `dev` または `prod`。各環境のパラメータ差分は tfvars に集約されているため、
`environments/*.tfvars.example` を見れば dev/prod の違いが一目でわかります。

## クイックスタート

プロジェクトルートから [Justfile](../Justfile) のレシピを使うのが最短です。
詳細な手順は [DEPLOY.md](./DEPLOY.md) を参照してください。

### 1. 準備

```powershell
# 変数ファイルの作成（dev/prod それぞれ）
cp terraform/environments/dev.tfvars.example  terraform/environments/dev.tfvars
cp terraform/environments/prod.tfvars.example terraform/environments/prod.tfvars

# 中身を編集（project_id、billing_account、gemini_api_key など）

# 初期化
just tf-init

# Google Cloud認証
gcloud auth application-default login
```

### 2. 基盤リソースの作成（環境ごとに1回）

`google_project` / API有効化 / Artifact Registry / Secret Manager などを先に作成します。

```powershell
just tf-bootstrap dev
# または
just tf-bootstrap prod
```

### 3. Dockerイメージのビルドとプッシュ

```powershell
# Docker認証（1回だけ）
just docker-auth

# dev環境向け
just docker-release-all visionfy-demo-dev dev

# prod環境向け
just docker-release-all visionfy-demo-prod latest
```

### 4. Cloud Runサービスのデプロイ

```powershell
just tf-plan dev      # 差分確認
just tf-apply dev     # 適用

just tf-plan prod
just tf-apply prod
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

Justfile 経由を推奨。生 `terraform` を使う場合は必ず `-var-file` と `-state` を両方指定してください。

```powershell
# Justfile 経由（推奨）
just tf-init
just tf-plan dev
just tf-apply dev
just tf-output dev
just tf-state-list dev
just tf-destroy dev
just tf-fmt
just tf-validate

# 生のterraformで実行する場合（dev環境の例）
terraform plan    -var-file=environments/dev.tfvars  -state=states/dev.tfstate
terraform apply   -var-file=environments/dev.tfvars  -state=states/dev.tfstate
terraform output  -state=states/dev.tfstate
terraform destroy -var-file=environments/dev.tfvars  -state=states/dev.tfstate
```

## 状態管理

Terraform の状態は環境別に `states/<env>.tfstate` にローカル保存されます。

**重要:** 以下のファイルは `.gitignore` で除外されており、バージョン管理にコミットされません:
- `states/*.tfstate` および `*.backup`
- `environments/*.tfvars`（`*.tfvars.example` は除く）
- `.terraform/`
