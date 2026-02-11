# API Test Console - Testing Guide

## 概要

バックエンドAPIの各エンドポイントをブラウザから直接テストできるWebインターフェースです。

## アクセス方法

1. バックエンドサーバーを起動
   ```bash
   cd backend
   python src/main.py
   ```

2. ブラウザで以下にアクセス
   ```
   http://localhost:8080
   ```

## テスト可能な機能

### 1. Health Check (GET /health)
- **説明**: サーバーの稼働状態を確認
- **テスト方法**: 「Check Health」ボタンをクリック
- **期待結果**: `{"status": "healthy"}` が返却される

### 2. Create CLAHE (POST /api/createclahe)
- **説明**: コントラスト制限適応ヒストグラム均等化を適用
- **パラメータ**:
  - `clipLimit` (float): クリップ制限 (デフォルト: 2.0)
  - `tileGridSize` (int): タイルグリッドサイズ (デフォルト: 8)
- **サンプル画像**: [sample.jpg](img/sample.jpg)
- **テスト手順**:
  1. サンプル画像をダウンロード
  2. 画像ファイルを選択
  3. パラメータを調整（必要に応じて）
  4. 「Upload & Process」をクリック
- **期待結果**: 処理された画像が返却され、プレビューが表示される

### 3. Grayscale (POST /api/grayscale)
- **説明**: グレースケール変換（オプションで二値化）
- **パラメータ**:
  - `threshold` (int, optional): 二値化閾値 (0-255)
- **サンプル画像**: [sample.jpg](img/sample.jpg)
- **テスト手順**:
  1. 画像ファイルを選択
  2. 必要に応じて閾値を設定
  3. 「Upload & Process」をクリック

### 4. Gaussian Blur (POST /api/gaussian_blur)
- **説明**: ガウシアンブラーを適用
- **パラメータ**:
  - `ksizeX`, `ksizeY` (int): カーネルサイズ（奇数）
  - `sigmaX`, `sigmaY` (float): 標準偏差
- **サンプル画像**: [sample.jpg](img/sample.jpg)
- **デフォルト値**: ksize=5, sigma=1.0
- **テスト手順**:
  1. 画像ファイルを選択
  2. パラメータを調整
  3. 「Upload & Process」をクリック

### 5. Remove Noise (POST /api/remove_noise)
- **説明**: メディアンフィルタによるノイズ除去
- **パラメータ**: なし（カーネルサイズ固定: 3x3）
- **サンプル画像**: [sample.jpg](img/sample.jpg)
- **テスト手順**:
  1. 画像ファイルを選択
  2. 「Upload & Process」をクリック

### 6. Restore Contrast (POST /api/restore_contrast)
- **説明**: ガンマ補正によるコントラスト復元
- **パラメータ**:
  - `gamma` (float): ガンマ値 (デフォルト: 1.7)
- **サンプル画像**: [sample.jpg](img/sample.jpg)
- **テスト手順**:
  1. 画像ファイルを選択
  2. ガンマ値を調整
  3. 「Upload & Process」をクリック

### 7. Restore Brightness (POST /api/restore_brightness)
- **説明**: 明るさ調整
- **パラメータ**:
  - `value` (int): 調整値（負の値で明るく、正の値で暗く。デフォルト: -30）
- **サンプル画像**: [sample.jpg](img/sample.jpg)
- **テスト手順**:
  1. 画像ファイルを選択
  2. 調整値を設定
  3. 「Upload & Process」をクリック

### 8. Model Inference (POST /api/model_inference)
- **説明**: 異常検知 + ヒートマップオーバーレイ
- **パラメータ**:
  - `overlayAlpha` (float): 元画像の重み (0-1, デフォルト: 0.6)
  - `heatmapAlpha` (float): ヒートマップの重み (0-1, デフォルト: 0.4)
- **サンプル画像**: [sample.jpg](img/sample.jpg)
- **注意**: GCS環境変数が設定されている必要があります
- **テスト手順**:
  1. 画像ファイルを選択
  2. アルファ値を調整
  3. 「Upload & Process」をクリック

### 9. Generate Code (POST /api/generate_code) 🆕
- **説明**: ワークフロー定義からPythonコードを生成
- **パラメータ**:
  - `processNodes` (array): 処理ノードの配列
- **サンプルワークフロー**: 「Load Sample Workflow」ボタンでロード可能
- **テスト手順**:
  1. 「Load Sample Workflow」をクリックしてサンプルをロード
  2. 必要に応じてJSONを編集
  3. 「Generate Code」をクリック
- **期待結果**: スタンドアロンで実行可能なPythonコードが生成される

#### サンプルワークフローJSON
```json
{
  "processNodes": [
    {
      "functionName": "grayscale",
      "params": {
        "enableThreshold": true,
        "threshold": 128
      }
    },
    {
      "functionName": "createclahe",
      "params": {
        "clipLimit": 2.0,
        "tileGridSize": [8, 8]
      }
    },
    {
      "functionName": "gaussianblur",
      "params": {
        "ksize": [5, 5],
        "sigmaX": 1.0,
        "sigmaY": 1.0
      }
    },
    {
      "functionName": "restore_contrast",
      "params": {
        "gamma": 1.7
      }
    }
  ]
}
```

## コマンドラインからのテスト

### Health Check
```bash
curl http://localhost:8080/health
```

### Generate Code
```bash
curl -X POST http://localhost:8080/api/generate_code \
  -H "Content-Type: application/json" \
  -d '{"processNodes": [{"functionName": "grayscale", "params": {}}]}'
```

### Grayscale
```bash
curl -X POST http://localhost:8080/api/grayscale \
  -F "file=@path/to/image.jpg" \
  -o output_grayscale.jpg
```

### CLAHE
```bash
curl -X POST http://localhost:8080/api/createclahe \
  -F "file=@path/to/image.jpg" \
  -F "clipLimit=2.0" \
  -F "tileGridSizeX=8" \
  -F "tileGridSizeY=8" \
  -o output_clahe.jpg
```

### Gaussian Blur
```bash
curl -X POST http://localhost:8080/api/gaussian_blur \
  -F "file=@path/to/image.jpg" \
  -F "ksizeX=5" \
  -F "ksizeY=5" \
  -F "sigmaX=1.0" \
  -F "sigmaY=1.0" \
  -o output_blur.jpg
```

## トラブルシューティング

### 画像が表示されない
- ブラウザのコンソールを確認
- サーバーログでエラーを確認
- 画像ファイル形式を確認（JPEG, PNG推奨）

### API URLが間違っている
- Configurationセクションで正しいURLを設定
- 「Save」ボタンをクリックして保存

### Model Inferenceが失敗する
- 環境変数 `MODEL_GCS_BUCKET` と `MODEL_GCS_PATH` が設定されているか確認
- GCSへのアクセス権限を確認
