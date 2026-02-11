# Logging

## Overview

フロントエンド（Next.js）は構造化ロギング（Pino）を使用し、Cloud Run本番環境ではGoogle Cloud Loggingに自動統合されます。

## ロギングライブラリ

- **Pino**: 高速・低オーバーヘッドのNode.jsロガー
- **@google-cloud/logging-pino**: Cloud Logging統合トランスポート（本番環境のみ）
- **pino-pretty**: 開発環境用の人間が読みやすい出力形式（devDependency）

## ログ設定

### 環境変数

| 変数名 | デフォルト値 | 説明 |
|--------|------------|------|
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | ログレベル（trace, debug, info, warn, error, fatal） |
| `GCP_PROJECT` | - | GCPプロジェクトID（Cloud Trace統合用、Terraformが自動設定） |
| `NODE_ENV` | `development` | 環境モード（production時にCloud Logging統合が有効化） |

### ログレベルマッピング

Pinoログレベル → Cloud Logging Severity:
- `trace` → `DEBUG`
- `debug` → `DEBUG`
- `info` → `INFO`
- `warn` → `WARNING`
- `error` → `ERROR`
- `fatal` → `CRITICAL`

## 使用方法

### 基本的なロガー作成

```typescript
import { createLogger } from "@/lib/logger";

const logger = createLogger('ModuleName');

logger.info('Simple log message');
logger.debug({ key: 'value' }, 'Structured log with context');
logger.error({ error: err.message }, 'Error occurred');
```

### API RouteでのHTTPコンテキスト付きロガー

```typescript
import { createLogger, withHttpContext } from "@/lib/logger";

const baseLogger = createLogger('APIName');

export async function POST(req: NextRequest) {
  // HTTPコンテキストとトレースIDを含むロガーを作成
  const logger = withHttpContext(baseLogger, req, 'POST', req.url);

  logger.info({ userId: 123 }, 'Request received');
  // ... 処理 ...
}
```

## Cloud Logging統合の特徴

### 1. Severityレベルのマッピング

`formatters.level`を使用してPinoのログレベルをCloud LoggingのSeverityにマッピング。Cloud Logging Consoleでのフィルタリングが可能。

### 2. HTTPリクエストコンテキスト

`withHttpContext`ヘルパーを使用すると、以下の情報がログに自動追加されます：

- `httpRequest.requestMethod`: HTTPメソッド (GET, POST, etc.)
- `httpRequest.requestUrl`: リクエストURL
- `httpRequest.status`: レスポンスステータスコード
- `httpRequest.userAgent`: User-Agentヘッダー
- `httpRequest.remoteIp`: クライアントIPアドレス (X-Forwarded-Forから取得)
- `httpRequest.referer`: Refererヘッダー

これにより、Cloud Logging Consoleで特定のHTTPリクエストに関連するログを簡単に抽出できます。

### 3. Cloud Trace統合

`withHttpContext`は`X-Cloud-Trace-Context`ヘッダーからトレースIDを抽出し、ログに追加します：

- `logging.googleapis.com/trace`: `projects/{PROJECT_ID}/traces/{TRACE_ID}`

これにより、Cloud Trace上で特定のリクエストのトレースとログを関連付けることができます。

## 開発環境 vs 本番環境

### 開発環境 (NODE_ENV=development)

- `pino-pretty`で人間が読みやすい形式で標準出力に出力
- カラー表示有効
- タイムスタンプは読みやすい形式

```
[2024-02-10 12:34:56] INFO (ChatAPI): Chat request received
    messageCount: 5
    hasNodes: true
```

### 本番環境 (NODE_ENV=production)

- `@google-cloud/logging-pino`トランスポートを使用
- JSON形式で構造化ログを出力
- Cloud Runが自動的に標準出力をCloud Loggingに送信
- Severity、HTTPコンテキスト、トレースIDが自動付与

```json
{
  "severity": "INFO",
  "message": "Chat request received",
  "module": "ChatAPI",
  "messageCount": 5,
  "hasNodes": true,
  "httpRequest": {
    "requestMethod": "POST",
    "requestUrl": "https://visionfy-frontend-xxx.run.app/api/chat"
  },
  "logging.googleapis.com/trace": "projects/my-project/traces/abc123..."
}
```

## ヘルパー関数

### createLogger(module: string)

モジュール名を指定してロガーを作成。全てのログに`module`フィールドが追加されます。

### withHttpContext(logger, req, method, url)

HTTPコンテキストとトレースIDを含む子ロガーを作成。API Route内で使用します。

### logEnvVar(logger, name, value, isSensitive)

環境変数を安全にログ出力。機密情報（APIキーなど）はマスク表示。

```typescript
logEnvVar(logger, 'GEMINI_API_KEY', process.env.GEMINI_API_KEY, true);
// Output: GEMINI_API_KEY loaded (value: AIza****)
```

### getTraceId(req)

リクエストからCloud TraceのトレースIDを抽出。

### getHttpContext(req, method, url, status?)

HTTPリクエストコンテキスト情報を取得。

## Cloud Loggingでのログ確認

1. **GCP Console** → **Logging** → **Logs Explorer**
2. フィルタ例：
   ```
   resource.type="cloud_run_revision"
   resource.labels.service_name="visionfy-frontend"
   severity>=INFO
   ```
3. **HTTPリクエストでフィルタ**：
   ```
   httpRequest.requestUrl=~"/api/chat"
   ```
4. **トレースIDでフィルタ**：
   ```
   trace="projects/my-project/traces/abc123..."
   ```

## パッケージインストール

依存関係を追加した後、以下を実行：

```powershell
cd frontend
pnpm install
```

## 関連ファイル

- `frontend/lib/logger.ts` - ロガー設定とヘルパー関数
- `frontend/app/api/chat/route.ts` - チャットAPI routeでの使用例
- `frontend/app/api/process-node/route.ts` - プロセスノードAPI routeでの使用例
- `frontend/package.json` - 依存関係定義
- `terraform/cloudrun.tf` - Cloud Run環境変数設定（LOG_LEVEL, GCP_PROJECT）
