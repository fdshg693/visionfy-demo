# Backend API サーバー

Visionfy Demo のバックエンド API サーバーです。Flask ベースの画像処理 API を提供し、OpenCV による画像処理と異常検知モデル推論機能を備えています。

## 📋 概要

このバックエンドサーバーは以下の機能を提供します：

- **画像処理 API**: 6種類の OpenCV ベース画像処理機能（CLAHE、グレースケール、ガウシアンブラー、ノイズ除去、コントラスト修復、明るさ修復）
- **異常検知 API**: Patchcore モデルによる異常検知とヒートマップ生成
- **コード生成 API**: ワークフロー定義からスタンドアロン Python スクリプトを生成
- **テスト用 UI**: 静的 HTML による API テストインターフェース
- **ヘルスチェック**: Cloud Run での監視用エンドポイント

## 🗂️ ディレクトリ構造

```text
backend/
├── src/
│   ├── main.py                     # Flask エントリポイント（全ルート定義）
│   ├── api/                        # API モジュール
│   │   ├── createclahe/            # CLAHE 適用
│   │   ├── grayscale/              # グレースケール変換 + オプション閾値処理
│   │   ├── gaussian_blur/          # ガウシアンブラー
│   │   ├── remove_noise/           # ノイズ除去（メディアンフィルタ）
│   │   ├── restore_contrast/       # コントラスト修復（ガンマ補正）
│   │   ├── restore_brightness/     # 明るさ修復
│   │   ├── model_inference/        # 異常検知モデル推論
│   │   └── generate_code/          # ワークフローから Python コード生成
│   ├── common/                     # 横断的ユーティリティ
│   │   ├── config.py               # 環境変数・定数（MAX_CONTENT_LENGTH など）
│   │   ├── decorators.py           # image_endpoint / json_endpoint
│   │   ├── exceptions.py
│   │   ├── image_processing.py
│   │   ├── params.py
│   │   ├── pipeline.py
│   │   ├── response.py             # create_error_response
│   │   └── validation.py
│   ├── storage/                    # 外部ストレージクライアント
│   │   └── gcs_client.py           # Patchcore モデルの GCS ロード
│   ├── models/                     # 機械学習モデル
│   │   └── model.ckpt              # Patchcore 異常検知モデル
│   ├── static/                     # テスト用静的 UI
│   │   ├── index.html
│   │   ├── css/
│   │   └── js/
│   └── imgs/                       # 静的アセット（favicon など）
│       └── favicon.ico
├── Dockerfile                      # Cloud Run 用コンテナ定義
├── requirements.txt                # Python 依存パッケージ
└── README.md                       # このファイル
```

## 🚀 ローカル実行方法

### 1. 依存パッケージのインストール

```powershell
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env.example` を `.env` にコピーして必要に応じて値を編集します。

```powershell
Copy-Item .env.example .env
```

各変数の Scope（ローカル / Cloud Run / 両方）は [`.env.example`](./.env.example) のコメントに記載。
横断的な一覧は [`docs/features/ENVIRONMENT.md`](../docs/features/ENVIRONMENT.md) を参照。

### 3. サーバー起動

```powershell
python src/main.py
```

サーバーは `http://0.0.0.0:8080` で起動します。

### 3. テスト UI にアクセス

ブラウザで `http://localhost:8080` を開くと、API テスト用の静的 UI が表示されます。

## 📡 API エンドポイント一覧

| メソッド | パス                       | 説明                                               |
|----------|----------------------------|----------------------------------------------------|
| `GET`    | `/`                        | 静的テスト UI を配信                                |
| `GET`    | `/health`                  | ヘルスチェック（`{"status": "healthy"}` を返却）    |
| `POST`   | `/api/createclahe`         | CLAHE（適応型ヒストグラム平坦化）を適用             |
| `POST`   | `/api/grayscale`           | グレースケール変換 + オプション閾値処理             |
| `POST`   | `/api/gaussian_blur`       | ガウシアンブラー（カーネルサイズ・シグマ指定可能）  |
| `POST`   | `/api/remove_noise`        | ノイズ除去（メディアンフィルタ）                    |
| `POST`   | `/api/restore_contrast`    | コントラスト修復（ガンマ補正）                      |
| `POST`   | `/api/restore_brightness`  | 明るさ修復（適応的輝度調整）                        |
| `POST`   | `/api/model_inference`     | 異常検知モデル推論 + ヒートマップ生成               |
| `POST`   | `/api/generate_code`       | ワークフロー定義 (JSON) から Python コードを生成   |

### リクエスト形式

- **画像処理系エンドポイント** (`/api/createclahe` … `/api/model_inference`): `multipart/form-data`
  - `file`: 処理対象の画像ファイル（必須）
  - その他のパラメータ: 各 API により異なる（詳細は各モジュールのコードを参照）
- **`/api/generate_code`**: `application/json`
  - `{"processNodes": [{"functionName": "...", "params": {...}}, ...]}`

### レスポンス形式

- 画像処理系: 処理済み画像を `image/jpeg` バイナリで返却（入力フォーマット問わず JPEG 出力）
- `/api/generate_code`: `{"code": "..."}` の JSON

### サイズ制限

`Config.MAX_CONTENT_LENGTH`（デフォルト 16MB、環境変数 `MAX_CONTENT_LENGTH` で上書き可）。超過時は `413 FILE_TOO_LARGE` を返却。

## 🐳 Docker 実行方法

### ローカルでのビルドと実行

```powershell
# イメージをビルド
docker build -t visionfy-backend .

# コンテナを起動
docker run -p 8080:8080 visionfy-backend
```

### Cloud Run へのデプロイ

Terraform 構成（`../terraform/`）を使用して自動デプロイされます。詳細は [terraform/README.md](../terraform/README.md) を参照してください。

## 🛠️ 技術スタック

| カテゴリ           | 技術                                    |
|--------------------|-----------------------------------------|
| **Web フレームワーク** | Flask 3.x                           |
| **画像処理**       | OpenCV (opencv-python-headless)         |
| **機械学習**       | PyTorch, anomalib (Patchcore)           |
| **数値計算**       | NumPy                                   |
| **HTTP サーバー**  | Gunicorn (本番環境)                     |
| **その他**         | Flask-CORS, Lightning                   |

## 📝 開発メモ

- ログレベルは環境変数 `LOG_LEVEL` で制御（デフォルト: `INFO`）
- `FLASK_DEBUG=1` の場合は自動的に `DEBUG` レベルになります
- 各ルートは `common/decorators.py` の `@image_endpoint` / `@json_endpoint` で統一的にログ・例外処理されます
- 各 API モジュールは独立しており、個別にテスト可能です
- 異常検知モデル（`model.ckpt`）は Patchcore アーキテクチャを使用しています
- `MODEL_GCS_BUCKET` / `MODEL_GCS_PATH` は `/api/model_inference` でのみ必須（未設定時は起動ログに警告）
- 環境変数の全リストと注入経路は [`docs/features/ENVIRONMENT.md`](../docs/features/ENVIRONMENT.md) を参照