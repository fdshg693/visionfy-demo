# Backend API サーバー

Visionfy Demo のバックエンド API サーバーです。Flask ベースの画像処理 API を提供し、OpenCV による画像処理と異常検知モデル推論機能を備えています。

## 📋 概要

このバックエンドサーバーは以下の機能を提供します：

- **画像処理 API**: 6種類の OpenCV ベース画像処理機能（CLAHE、グレースケール、ガウシアンブラー、ノイズ除去、コントラスト修復、明るさ修復）
- **異常検知 API**: Patchcore モデルによる異常検知とヒートマップ生成
- **テスト用 UI**: 静的 HTML による API テストインターフェース
- **ヘルスチェック**: Cloud Run での監視用エンドポイント

## 🗂️ ディレクトリ構造

```text
backend/
├── src/
│   ├── main.py                     # Flask エントリポイント（全7ルート定義）
│   ├── api/                        # 画像処理 API モジュール
│   │   ├── createclahe/            # CLAHE 適用
│   │   │   └── main.py
│   │   ├── grayscale/              # グレースケール変換 + オプション閾値処理
│   │   │   └── main.py
│   │   ├── gaussian_blur/          # ガウシアンブラー
│   │   │   └── main.py
│   │   ├── remove_noise/           # ノイズ除去（メディアンフィルタ）
│   │   │   └── main.py
│   │   ├── restore_contrast/       # コントラスト修復（ガンマ補正）
│   │   │   └── main.py
│   │   ├── restore_brightness/     # 明るさ修復
│   │   │   └── main.py
│   │   └── model_inference/        # 異常検知モデル推論 🆕
│   │       └── main.py
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

### 2. サーバー起動

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
| `POST`   | `/api/model_inference`     | 異常検知モデル推論 + ヒートマップ生成 🆕            |

### リクエスト形式

すべての `POST` エンドポイントは `multipart/form-data` 形式で画像ファイルとパラメータを受け取ります：

- `file`: 処理対象の画像ファイル（必須）
- その他のパラメータ: 各 API により異なる（詳細は各モジュールのコードを参照）

### レスポンス形式

処理済み画像を直接バイナリで返却します（Content-Type: `image/png` または `image/jpeg`）。

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
- 各 API モジュールは独立しており、個別にテスト可能です
- 異常検知モデル（`model.ckpt`）は Patchcore アーキテクチャを使用しています