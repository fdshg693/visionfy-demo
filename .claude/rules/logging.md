---
paths:
  - "frontend/lib/logger.ts"
  - "frontend/app/api/**/route.ts"
  - "backend/src/main.py"
  - "backend/src/api/**/main.py"
---

# ロギング

権威ドキュメント: [ai/overview/frontend_logging.md](../../ai/overview/frontend_logging.md)

## Frontend（Next.js / Pino）

- 構造化ロガーは `frontend/lib/logger.ts` の `createLogger(module)` で生成。本番（`NODE_ENV=production`）では `@google-cloud/logging-pino` 経由で Cloud Logging に統合、開発時は `pino-pretty`。
- API Route では `withHttpContext(logger, req, method, url)` を使い、`X-Cloud-Trace-Context` からトレース ID を抽出して `logging.googleapis.com/trace` フィールドに乗せる。Cloud Trace と相関可能。
- 機密値は `logEnvVar(logger, 'GEMINI_API_KEY', value, true)` でマスクログ。
- `LOG_LEVEL` 環境変数: dev デフォルト `debug`、prod デフォルト `info`。

## Backend（Flask / 標準 logging）

- `logging.basicConfig` でルートロガー構成。`LOG_LEVEL` は大文字小文字許容（`upper()` 適用）、不正値は `INFO` フォールバック。
- `FLASK_DEBUG` truthy で `LOG_LEVEL` のデフォルトが `DEBUG` に上がる。
- 各ルートハンドラは `[<func_name>] Request received - form: {...}, files: [...]` を出力し、例外時は `logger.error(..., exc_info=True)` でスタックトレース込みで再 raise する。画像バイナリはログに出ない（`dict(request.form)` と `list(request.files.keys())` のみ）。
- `app.run()` 前に `log_env_vars()` が `FLASK_DEBUG`/`LOG_LEVEL`/`PORT` を出力し、未設定値を警告。

## Cloud Logging クエリ例

```
resource.type="cloud_run_revision"
resource.labels.service_name="visionfy-frontend"
severity>=INFO
httpRequest.requestUrl=~"/api/chat"
```
