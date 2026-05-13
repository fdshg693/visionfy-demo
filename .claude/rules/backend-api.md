---
paths:
  - "backend/src/main.py"
  - "backend/src/api/**"
  - "frontend/lib/backendApiService.ts"
  - "frontend/lib/backendApiAdapters.ts"
  - "frontend/app/api/process-node/**"
  - "frontend/app/api/generate-code/**"
---

# バックエンドAPI連携 / 新処理関数の追加

権威ドキュメント:
- 新関数追加の5ステップと型システム: [docs/features/API.md](../../docs/features/API.md)

## リクエストフロー

```
Browser → POST /api/process-node (Next.js, 汎用ディスパッチ・変更不要)
        → BackendApiService.processImage(functionName, ...)
        → adapter (functionName別、FormData構築)
        → POST /api/<route> (Flask, multipart/form-data)
        → image/jpeg レスポンス
```

- **すべて `multipart/form-data`**: 画像 = `file`、パラメータは文字列フィールド。Flask 側は `request.files['file']` と `request.form.get(...)`。
- **`functionName` とバックエンドルートは独立**: 例 `gaussianblur` → `/api/gaussian_blur`、`createclahe` → `/api/createclahe`（typo は意図的・固定）。
- **フォールバックアダプタなし**: 未登録の `functionName` は `BackendApiService` が `ProcessingError` で即失敗。

## 新関数追加チェックリスト（5ステップ、詳細は API.md）

1. **型・メタデータ**: `frontend/types/processFunctionBase.ts` の `PROCESS_FUNCTIONS_BASE` に追加（UI フォーム・デフォルト値が自動導出）。`frontend/types/processNode.ts` に `XxxParams` / `XxxData` を追加して判別共用体に組み込む。
2. **アダプタ**: `frontend/lib/backendApiAdapters.ts` にビルダー関数 + `createBackendAdapters()` に登録。
3. **バックエンドモジュール**: `backend/src/api/<func>/main.py` に `@dataclass(frozen=True)` のパラメータ型 + `_parse_params(request)` + 処理関数を実装。
4. **ルート登録**: `backend/src/main.py` に `POST /api/<route>` を追加（薄いラッパー: ログ → モジュール関数呼び出し → exc_info 付き再 raise）。
5. **AI 連携**: `PROCESS_FUNCTIONS_BASE` を更新すれば `NODE_DESCRIPTIONS` が自動更新され、`get_available_nodes` ツールに即反映。

## 既存7関数（Backend エンドポイント）

| Frontend functionName | Backend Route |
|----------------------|---------------|
| `createclahe` | `/api/createclahe` |
| `grayscale` | `/api/grayscale` |
| `gaussianblur` | `/api/gaussian_blur` |
| `remove_noise` | `/api/remove_noise` |
| `restore_contrast` | `/api/restore_contrast` |
| `restore_brightness` | `/api/restore_brightness` |
| `model_inference` | `/api/model_inference` |

非自明な処理（CLAHE はグレースケール強制デコード、Restore Brightness は減算ベース、GaussianBlur の奇数ksize強制など）は [[backend-internals]] を参照。
