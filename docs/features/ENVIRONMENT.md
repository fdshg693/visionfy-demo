# 環境変数 — 横断マトリクス

このプロジェクトの環境変数を **「どこで必要か × どこで定義するか」** で一覧化したもの。
個別の説明はサンプルファイル内コメントに記載されているため、ここでは Scope と注入経路に絞る。

## サンプルファイルの場所

| ファイル | 用途 |
|---|---|
| [`backend/.env.example`](../../backend/.env.example) | ローカル backend (`python src/main.py`) 用 |
| [`frontend/.env.example`](../../frontend/.env.example) | ローカル frontend (`pnpm dev`) 用 |
| [`terraform/environments/dev.tfvars.example`](../../terraform/environments/dev.tfvars.example) | Cloud Run (dev) の Terraform 入力 |
| [`terraform/environments/prod.tfvars.example`](../../terraform/environments/prod.tfvars.example) | Cloud Run (prod) の Terraform 入力 |

ローカル開発では `.env.example` → `.env` にコピーして実値を埋める。
Cloud Run 環境では Terraform が [`terraform/cloudrun.tf`](../../terraform/cloudrun.tf) の `env` ブロックで直接注入するため `.env` は使わない。

## Frontend (Next.js / Cloud Run service: `visionfy-frontend`)

| 変数 | ローカル | Cloud Run | 注入元 (Cloud) | 必須 |
|---|---|---|---|---|
| `API_BASE_URL` | `.env` で `http://localhost:8080` | TF が backend URL を注入 | `google_cloud_run_v2_service.backend.uri` | ✅ |
| `GEMINI_API_KEY` | `.env` に生値 | Secret Manager 経由 | tfvars `gemini_api_key` → Secret → `value_source.secret_key_ref` | ✅ |
| `LOG_LEVEL` | `.env` で任意上書き | TF 変数 | tfvars `frontend_log_level`（dev=`debug` / prod=`info`） | ❌ |
| `GCP_PROJECT` | 未設定 OK（Trace 連携無効化） | TF が project ID を注入 | `google_project.main.project_id` | ❌ |
| `ENABLE_CLOUD_LOGGING` | 未設定（`false` 扱い、pino-pretty へ） | TF 変数（既定 `true`） | tfvars `frontend_enable_cloud_logging` | ❌ |
| `NODE_ENV` | `next dev` が自動 | `next start` が自動 | — | 自動 |
| `PORT` | `pnpm dev` の既定 3000 | Cloud Run が自動付与 | — | 自動 |

## Backend (Flask / Cloud Run service: `visionfy-backend`)

| 変数 | ローカル | Cloud Run | 注入元 (Cloud) | 必須 |
|---|---|---|---|---|
| `LOG_LEVEL` | `.env` で任意上書き | TF 変数 | tfvars `backend_log_level`（dev=`DEBUG` / prod=`INFO`） | ❌ |
| `FLASK_DEBUG` | `.env` で `1` 推奨 | 未設定 | — | ❌ |
| `MODEL_GCS_BUCKET` | 未設定 OK（ローカル checkpoint 使用時） | TF が bucket 名を注入 | `google_storage_bucket.models.name` | `/api/model_inference` でのみ必須 |
| `MODEL_GCS_PATH` | 未設定 OK | TF 変数 | tfvars `model_gcs_object_path`（既定 `models/model.ckpt`） | `/api/model_inference` でのみ必須 |
| `MODEL_CACHE_DIR` | 未設定で `src/models/` を使用 | 未設定で `/tmp` を使用（K_SERVICE が自動判別） | — | ❌ |
| `MAX_CONTENT_LENGTH` | 未設定で 16MB | 未設定で 16MB | — | ❌ |
| `K_SERVICE` | 未設定 | Cloud Run が自動付与 | — | 自動 |
| `PORT` | 未使用（`app.run` がハードコード 8080） | Cloud Run が 8080 を渡す | — | 自動 |
| `GOOGLE_APPLICATION_CREDENTIALS` | `gcloud auth application-default login` 推奨 | SA を Cloud Run が自動付与 | — | GCS アクセス時のみ |

## 新しい env を追加するときの手順

1. **どこで読むか決める** — backend/frontend のコードに `os.environ` / `process.env` を追加。
2. **対応する `.env.example` を更新** — Scope コメント (`[local]` / `[cloud]` / `[both]` / `[opt]`) 付きで。
3. **Cloud Run でも必要なら**:
   - 動的でない静的値 → `terraform/variables.tf` に変数を追加 → `cloudrun.tf` の `env` ブロックに `var.xxx` を参照
   - tfvars に環境差分を出したい場合 → `environments/<env>.tfvars.example` に追記（dev/prod 両方）
   - シークレットの場合 → [`terraform/secrets.tf`](../../terraform/secrets.tf) に Secret Manager リソースを定義 → `value_source.secret_key_ref` で参照
4. **このマトリクスを更新** — 行を追加して Scope を明示。
