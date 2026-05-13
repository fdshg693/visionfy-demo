---
paths:
  - "backend/**"
---

# Backend — 非自明な内部仕様

コードを読んだだけでは気付きにくい挙動・仕様。エンドポイント追加手順は [[backend-api]] を参照。

## Flask アプリ起動と基盤

- `backend/src/main.py` がエントリ。ローカルは `python main.py`（`0.0.0.0:8080`, `debug=True`）、本番は Gunicorn。
- `CORS(app)` は **無制限**（オリジン制限なし）。Next.js フロントが別ポート/ドメインで動くため。
- `static_url_path=""` + `static_folder="static"` で `/` が `backend/src/static/index.html` を直接配信（テスト用スタンドアロン UI、 [backend/src/static/README.md](../../backend/src/static/README.md)）。
- 各ルートハンドラは薄いラッパー: ログ出力 → API モジュール関数呼び出し → 例外時 `exc_info=True` で再 raise。

## 全エンドポイント共通パターン

- **`multipart/form-data` 必須**: 画像 = `request.files['file']`、パラメータ = `request.form.get(...)`。
- 画像デコード: `np.frombuffer(file.read(), np.uint8)` → `cv2.imdecode(buffer, flags)`。**CLAHE のみ `flags=0`（grayscale 強制デコード）**、他は `IMREAD_COLOR`。
- **入力フォーマットを問わず出力は常に JPEG** (`Content-Type: image/jpeg`)。PNG の透過は失われる。
- 戻り型は `Union[Response, Tuple[str, int]]`: 成功は `make_response(buffer.tobytes())`、エラーは `(message, status_code)`。
- パース例外は 400 (`ValueError`)、処理例外は 500。型強制失敗（`int("abc")`）は `ValueError` の汎用メッセージで「どのパラメータが」までは特定できない。

## パラメータ定義パターン

- 各 API モジュールは `@dataclass(frozen=True)` で `<FunctionName>Params` を定義（不変保証）。
- `_parse_params(request)` がモジュールローカルのプライベートヘルパー。
- `request.form.get(key, default)` のデフォルトが **ランタイムのデフォルト値**（dataclass のフィールドデフォルトは型ヒント目的、必ずしも一致しない）。
- **範囲チェックなし**: gamma < 0、巨大 ksize なども検出されず、OpenCV 側で失敗 or clamp。

## 関数別の注意

- **CLAHE**: グレースケール強制（カラー入力は decode 時点で gray 化）。`tileGridSize` はフロントが `tileGridSizeX` / `tileGridSizeY` を別フィールドで送る。
- **Grayscale**: `threshold` が `None` (キー不在) または `""` の場合は閾値処理スキップ。`cv2.THRESH_BINARY` (0/255 二値)。
- **GaussianBlur**: パース後に偶数 `ksize` を +1 して奇数化。`ksize=0` は OpenCV が sigma から自動計算。`ksize`/`sigma` 全 0 なら処理スキップ（恒等）。
- **RemoveNoise**: パラメータなし、`cv2.medianBlur(img, 3)` 固定。
- **RestoreContrast**: ガンマ補正を **LUT (256 要素)** で実装。`safe_gamma = gamma if gamma > 0 else 1.0`、補正は **`1/gamma`** を適用（フロントが 1.7 を送ると 1/1.7 が適用される）。
- **RestoreBrightness**: `value` は **減算**される。デフォルト `-30` → 30 単位明るくなる（命名と逆向き）。`np.float32` に変換してから `np.clip(0, 255)` → `uint8`。`value=0` は早期 return。

## デプロイ・実行

- 必須 OS パッケージ: `libglib2.0-0`, `libgl1`, `libxcb1`（`opencv-python-headless` 用、欠けると `libGL.so.1` ImportError）。
- Gunicorn: `--workers 1 --threads 8 --timeout 0`。CPU バウンドの OpenCV は GIL フレンドリーな単一プロセス＋スレッドが効率的。timeout は Cloud Run 側に任せる。
- `PYTHONUNBUFFERED True` で stdout/stderr 非バッファ化（Cloud Run logs 即時反映）。
- `WORKDIR` が 2 回切り替わる: `/app` で deps インストール → `/app/src` で runtime。`CMD exec gunicorn ... main:app` は `src/` から起動。`exec` 置換で SIGTERM を gunicorn まで届ける。

## その他

- ルートパス `/api/createclahe`（スネークではなく結合）は **意図的**。フロントアダプタが厳密に一致させている。
- `/favicon.ico` だけ `backend/src/imgs/` から `send_from_directory(mimetype="image/vnd.microsoft.icon")` で配信（`static/` 外）。
- CSRF 保護なし。CORS が `allow credentials` なしで全許可なので最低限の保護はあるが、フロントが信頼前提の API。
- `request.files['file'].filename` の空判定は `""` チェック（`None` ではない）。
