---
paths:
  - "terraform/**"
  - "**/Dockerfile"
  - ".github/**"
---

# インフラ（GCP / Terraform / Docker）

すべて GCP・Terraform 管理。デフォルトリージョン `asia-northeast1`。**Docker イメージのビルド/プッシュは `terraform apply` の前**に手動で行う必要がある（Cloud Run が参照するため）。

- ファイル構成・コマンド: [terraform/README.md](../../terraform/README.md)

## 環境分離

dev / prod は **同一の `.tf` ファイル群** を共有し、以下のみが環境差分:
- 変数値: `terraform/environments/<env>.tfvars`（`-var-file` で切替）
- state: `terraform/states/<env>.tfstate`（`-state` で切替）

`environments/*.tfvars` と `states/*.tfstate` は `.gitignore` 対象。`*.tfvars.example` を見れば dev/prod の差分が一目でわかる。

## Cloud Run リソース

| Service | Port | CPU | Mem | Scale | 備考 |
|---------|------|-----|-----|-------|------|
| `visionfy-frontend` | 3000 | 1 | 512Mi | 0–5/10 | Secret Manager から `GEMINI_API_KEY` を取得。`API_BASE_URL` をバックエンドURLに動的注入 |
| `visionfy-backend`  | 8080 | 2 | 4Gi   | 0–3   | 初回推論時に GCS から `model.ckpt` を遅延ロード（最大100秒のスタートアッププローブ） |

両サービスとも `allUsers` 公開。バックエンド SA は `roles/storage.objectViewer`、フロント SA は `roles/secretmanager.secretAccessor`。

## Docker 詳細

- Frontend: `node:22-alpine` 3 ステージ（deps → builder → runner）、standalone 出力、非 root ユーザ。
- Backend: `python:3.12-slim` 2 ステージ。`libglib2.0-0` / `libgl1` / `libxcb1` が `opencv-python-headless` の実行に必須。Gunicorn `--workers 1 --threads 8 --timeout 0`（CPU bound + Cloud Run がライフサイクル管理）。
