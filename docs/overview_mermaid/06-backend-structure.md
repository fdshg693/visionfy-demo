# 06. バックエンド構成

`backend/src/` の構成と、Flask エンドポイントが共通基盤（デコレータ・config・例外・レスポンス）にどう乗っているか。

## ディレクトリと依存関係

```mermaid
graph TD
    Main[main.py<br/>Flask app + ルート定義]

    subgraph Common[common/ 共通基盤]
        Config[config.py<br/>MAX_CONTENT_LENGTH 等]
        Deco[decorators.py<br/>@image_endpoint<br/>@json_endpoint]
        Resp[response.py<br/>create_error_response]
        Exc[exceptions.py]
        ImgProc[image_processing.py<br/>共通変換]
        Params[params.py<br/>パラメータ基底]
        Pipe[pipeline.py]
        Valid[validation.py]
    end

    subgraph ApiPkg[api/ エンドポイント別パッケージ]
        CLAHE[createclahe/main.py]
        Gray[grayscale/main.py]
        Gauss[gaussian_blur/main.py]
        Noise[remove_noise/main.py]
        Contrast[restore_contrast/main.py]
        Bright[restore_brightness/main.py]
        Infer[model_inference/main.py]
        Gen[generate_code/main.py]
    end

    subgraph Models[models/ ML 推論]
        Inf[inference.py]
        Pre[preprocessing.py]
        Vis[visualization.py]
    end

    subgraph Storage[storage/]
        GCS[GCS clientラッパ]
    end

    subgraph Static[static/ + imgs/]
        Html[index.html<br/>テスト用 UI]
        Css[css/style.css]
        Js[js/api.js, main.js,<br/>ui.js, config.js]
        Fav[imgs/favicon.ico]
    end

    Main --> Deco
    Main --> Config
    Main --> Resp
    Main --> CLAHE
    Main --> Gray
    Main --> Gauss
    Main --> Noise
    Main --> Contrast
    Main --> Bright
    Main --> Infer
    Main --> Gen
    Main -.serve static.-> Html
    Main -.serve.-> Fav

    Deco --> Resp
    Deco --> Exc

    CLAHE --> ImgProc
    Gray --> ImgProc
    Gauss --> ImgProc
    Noise --> ImgProc
    Contrast --> ImgProc
    Bright --> ImgProc
    Infer --> Models
    Models --> Storage
    Storage -. lazy load .-> GCSExt[(GCS bucket<br/>model.ckpt)]

    classDef ext fill:#fff8e1,stroke:#f9a825
    class GCSExt ext
```

## エンドポイントの統一パターン

```mermaid
sequenceDiagram
    participant Client
    participant Route as Flask Route
    participant Deco as @image_endpoint
    participant Module as api/&lt;func&gt;/main.py
    participant CV as OpenCV

    Client->>Route: POST multipart/form-data
    Route->>Deco: ハンドラ呼び出し
    Deco->>Deco: ログ: "[func] Request received - form: {...}, files: [...]"
    Deco->>Module: apply_xxx(request)
    Module->>Module: _parse_params(request)<br/>= request.form.get(...)
    Module->>Module: cv2.imdecode(buffer, flags)
    Module->>CV: 変換処理
    CV-->>Module: ndarray
    Module->>Module: cv2.imencode('.jpg', img)
    alt 成功
        Module-->>Deco: Response(image/jpeg)
        Deco->>Deco: 成功ログ
        Deco-->>Route: Response
        Route-->>Client: 200 image/jpeg
    else 例外
        Module--xDeco: raise
        Deco->>Deco: logger.error(..., exc_info=True)
        Deco-->>Route: 再 raise
        Route-->>Client: 4xx / 5xx
    end
```

## 補足

### 共通基盤（`common/`）の役割
- **`@image_endpoint("<name>")` / `@json_endpoint("<name>")`**: リクエストログ・成功ログ・`exc_info=True` 付き例外再 raise を一括担当。ハンドラ本体に `logger.info()` を **書かない**（重複ログになる）。
- **`config.py`**: `MAX_CONTENT_LENGTH`（デフォルト 16MB）を環境変数で上書き可能に管理。
- **`response.py`**: エラー JSON のフォーマット統一（`create_error_response(message, code, error_code)`）。

### 各画像エンドポイントの共通実装パターン
- `@dataclass(frozen=True)` で `<FunctionName>Params` を定義（不変保証）。
- `_parse_params(request)` は **モジュールローカル** プライベートヘルパー。
- `request.form.get(key, default)` のデフォルトが **ランタイムの真のデフォルト**（dataclass のフィールドデフォルトと一致しないことがある）。
- **範囲チェックなし**: 異常値は OpenCV 側で失敗 or clamp。

### `/api/generate_code` だけ例外
- **JSON in / JSON out**（他は multipart/jpeg）。
- 内部 `SUPPORTED_FUNCTIONS` に `model_inference` を **含まない** → コード生成不可なステップはコメントとしてスキップ表示。
- 新関数追加時は `SUPPORTED_FUNCTIONS` / `FUNCTION_DEFS` / `_build_call_code` の **3 箇所** 追記が必要。忘れると黙ってスキップ。

### モデル推論
- `model_inference` は anomalib Patchcore。初回呼び出し時に GCS から `model.ckpt` を **遅延ロード** → 最大 100 秒のスタートアッププローブで吸収。
- `MODEL_GCS_BUCKET` / `MODEL_GCS_PATH` が未設定でも他エンドポイントは動く（警告ログのみ）。

### Flask アプリ起動の細部
- `static_url_path=""` + `static_folder="static"` で `/` がテスト用スタンドアロン UI を直配信。
- `CORS(app)` は **無制限**。Next.js が別ポート／別ドメインで動く想定。
- `/favicon.ico` だけ `static/` 外（`imgs/`）から `send_from_directory(mimetype="image/vnd.microsoft.icon")` で配信。
- `validate_env_vars()` / `log_env_vars()` は **モジュールレベル実行** → Gunicorn 起動でも走り、Cloud Run logs に環境変数が出る。

詳細: [.claude/rules/backend-internals.md](../../.claude/rules/backend-internals.md), [.claude/rules/backend-api.md](../../.claude/rules/backend-api.md)
