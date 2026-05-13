# Visionfy Demo

画像処理ワークフローアプリケーション。ノードベースのワークフロー（Start → Process → End）で
OpenCV変換を画像に適用し、リアルタイムで結果を表示します。

## プロジェクト構成

```text
.
├── backend/      # Python Flask API (Cloud Run)
├── frontend/     # Next.js フロントエンド (Cloud Run)
└── terraform/    # GCPインフラ (Terraform)
```

## アーキテクチャ

```text
+----------------------+           +----------------------+
|   Frontend (Next.js) |   HTTPS   |   Backend (Flask)    |
|   [Cloud Run]        +---------->+   [Cloud Run]        |
+----------------------+           +----------------------+
```

両サービスは同一GCPプロジェクト上のCloud Runで稼働し、Terraformで管理されています。

## 前提条件

- [Terraform](https://www.terraform.io/downloads) >= 1.5
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [Docker](https://docs.docker.com/get-docker/)
- GCPの組織IDと請求先アカウント

## デプロイ

詳細は `terraform/README.md` を参照してください。

### クイックスタート

```powershell
# 1. インフラ作成
cd terraform
cp terraform.tfvars.example terraform.tfvars  # 値を編集
terraform init
terraform apply

# 2. Docker認証
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# 3. バックエンドのビルド・プッシュ
docker build -t asia-northeast1-docker.pkg.dev/PROJECT_ID/visionfy-demo/backend:latest ./backend
docker push asia-northeast1-docker.pkg.dev/PROJECT_ID/visionfy-demo/backend:latest

# 4. フロントエンドのビルド・プッシュ
docker build -t asia-northeast1-docker.pkg.dev/PROJECT_ID/visionfy-demo/frontend:latest ./frontend
docker push asia-northeast1-docker.pkg.dev/PROJECT_ID/visionfy-demo/frontend:latest

# 5. Cloud Runサービスをデプロイ
terraform apply
```

## ローカル開発

### フロントエンド (`frontend/`)
```powershell
pnpm install
pnpm dev        # localhost:3000
```

### バックエンド (`backend/`)
```powershell
pip install -r requirements.txt
python src/main.py   # localhost:8080
```

## 参考ファイル

- `.claude\rules`: Claudeに渡すRULEファイル

- `docs\features`: 機能のまとめ
    - AI機能・API・フローキャンバス・ワークフロー保存
    - 該当箇所をAIに渡して開発させることで、効率的に実装可能

- `docs\overview_mermaid`: Mermaid図による概要説明

- `terraform/README.md`: インフラの概要