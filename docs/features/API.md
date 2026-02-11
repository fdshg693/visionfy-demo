# バックエンドAPI連携ガイド（新しい処理関数の追加手順）

## 概要

- Flask バックエンドに新しい画像処理エンドポイントを追加する際、フロントエンド側で **5箇所** の変更が必要
- リクエストフロー: **Browser → Next.js proxy route → BackendApiService → Adapter → Flask backend**
- アダプタ層が JSON + base64画像 を `multipart/form-data`（Flask の `request.files` + `request.form`）に変換
- Next.jsプロキシルート（`frontend/app/api/process-node/route.ts`）は汎用ディスパッチのため **変更不要**

## 現在サポートされている処理関数（7種）

| 関数名 | 表示名 | アイコン | バックエンドエンドポイント |
|--------|--------|----------|--------------------------|
| `createclahe` | CLAHE（コントラスト制限適応ヒストグラム均等化） | `histogram` | `/api/createclahe` |
| `gaussianblur` | ガウシアンブラー | `brush` | `/api/gaussian_blur` |
| `grayscale` | グレイスケール変換 | `palette` | `/api/grayscale` |
| `remove_noise` | ノイズ除去（メディアンブラー） | `settings` | `/api/remove_noise` |
| `restore_brightness` | 明るさ復元 | `image` | `/api/restore_brightness` |
| `restore_contrast` | コントラスト復元（ガンマ補正） | `image` | `/api/restore_contrast` |
| `model_inference` | モデル推論（Patchcore異常検知） | `scan` | `/api/model_inference` |

## Pythonコード生成API

- **エンドポイント**: `POST /api/generate_code`
- **リクエストフロー**: Browser → Next.js proxy route (`/api/generate-code`) → Flask backend (`/api/generate_code`)
- **リクエスト**: JSON body（SimpleWorkflow形式）
- **レスポンス**: `{ "code": "import cv2\n..." }`（生成されたPythonスクリプト）
- **対応関数**: OpenCV系6関数（`model_inference` は除外。ワークフローに含まれる場合はスキップ＋コメント出力）
- **生成コードの特徴**:
  - ワークフローで使用する関数の定義のみを含める（不要な関数は除外）
  - 各ステップに対応する呼び出しコードをパラメータ付きで生成
  - `import cv2` / `import numpy as np` を自動付加
  - `cv2.imread()` / `cv2.imwrite()` による入出力を含むスタンドアロンスクリプト
- **UI**: FlowCanvasの「🐍 コード生成」ボタン → `GenerateCodeModal` でコード表示・コピー・ダウンロード

### 関連ファイル

- `backend/src/api/generate_code/main.py` — コード生成ロジック（関数定義テンプレート + 呼び出しコード組み立て）
- `backend/src/main.py` — `POST /api/generate_code` ルート登録
- `frontend/app/api/generate-code/route.ts` — Next.jsプロキシルート
- `frontend/app/components/workflow/GenerateCodeModal.tsx` — コード表示モーダル（コピー・ダウンロード機能付き）

## 型システムアーキテクチャ

- **Single Source of Truth**: `frontend/types/processFunctionBase.ts` に全関数のメタデータを一元定義（`PROCESS_FUNCTIONS_BASE`）
- ここから以下が自動導出される:
  - `VISIONFY_FUNCTIONS_CONFIG`（UIパラメータ定義） — `frontend/types/processFunction.ts`
  - `DEFAULT_NODE_PARAMS` / `DEFAULT_NODE_ICONS`（デフォルト値・アイコン） — `frontend/types/processNode.ts`
  - `NODE_DESCRIPTIONS`（AIツール用説明） — `frontend/lib/tools/availableNodesTool.ts`

## Step 1 — 型とデフォルト値の定義

- `frontend/types/processFunctionBase.ts` に新関数のエントリを `PROCESS_FUNCTIONS_BASE` に追加
  - `functionName`, `label`, `icon`, `description`, `params`（型・範囲・デフォルト値）を定義
  - これにより `VISIONFY_FUNCTIONS_CONFIG`, `DEFAULT_NODE_PARAMS`, `DEFAULT_NODE_ICONS` が自動生成される
- `frontend/types/processNode.ts` に対応するパラメータインターフェース（例: `XxxParams`）とデータインターフェース（例: `XxxData`）を追加
  - `XxxData` は `BaseProcessNodeData` を拡張し、リテラル `functionName` と `params: XxxParams` を持つ
  - `ProcessNodeData` 判別共用体に追加
  - `ProcessNodeParamsMap` にマッピングを追加
  - `ProcessNodeFunctionName` ユニオンに追加

## Step 2 — UIパラメータ設定

- `frontend/types/processFunctionBase.ts` のエントリに正しい `params` 定義があれば、UIパラメータ設定は自動生成される
- パラメータの `type` は `number` / `text` / `boolean` / `tuple` / `select` から選択
- パラメータフィールドは `frontend/app/components/nodes/paramFields/` 配下の5つのコンポーネントで動的にレンダリングされる

## Step 3 — バックエンドアダプタの作成

- `frontend/lib/backendApiAdapters.ts` に新しいアダプタビルダー関数を追加
  - `RequestAdapterArgs` を受け取り `RequestAdapterResult`（`{ url, init }`）を返す
  - `FormData` に `file`（画像Blob）と各パラメータを文字列フィールドとして格納
  - `base64ToBlob` は `args` 経由で注入される
- `createBackendAdapters()` 内で新しい `functionName` をキーにしてアダプタを登録
- **注意**: `functionName` とバックエンドルートパスは独立（例: `gaussianblur` → `/api/gaussian_blur`）

## Step 4 — インスペクタUIの追加

- `frontend/app/components/inspectors/` 配下にインスペクタコンポーネントを作成するか、既存の汎用レンダリングを利用
- `ProcessNodeInspector`（`frontend/app/components/inspectors/ProcessNodeInspector.tsx`）内の `functionName` スイッチに新しいケースを追加
- パラメータフィールドは `ProcessNodeParamInputs`（`frontend/app/components/nodes/ProcessNodeParamInputs.tsx`）が `VISIONFY_FUNCTIONS_CONFIG` から動的に生成するため、標準的なパラメータ型のみの場合はカスタムインスペクタ不要

## Step 5 — ノード追加時のデフォルト更新

- `frontend/constants/flowConfig.ts` の `handleAddNode` で新規ノードのデフォルトは `createclahe` にハードコード
- 新関数をノード追加時に選択可能にする場合は、このロジックを更新
- `frontend/constants/index.ts` はノード種別（Start/Process/End）のみを定義しており変更不要

## チェックリスト

- **型定義** — `processFunctionBase.ts` にメタデータ追加 + `processNode.ts` にインターフェース・共用体メンバー追加
- **UIパラメータ** — `processFunctionBase.ts` のエントリで自動生成（手動設定は原則不要）
- **アダプタ** — `backendApiAdapters.ts` にビルダー関数 + 登録
- **インスペクタ** — `inspectors/` 配下にコンポーネント追加、または汎用レンダリングで対応
- **確認** — `functionName` がリテラル型・アダプタキー・インスペクタスイッチで一致すること

## よくある問題

- **アダプタ未登録** — `functionName` に対応するアダプタがないと `BackendApiService` が `ProcessingError` をスロー
- **パラメータ名の不一致** — FormData のフィールド名は Flask ハンドラの `request.form` と完全一致が必要
- **デフォルト値の一元化** — `PROCESS_FUNCTIONS_BASE` にデフォルト値を定義すれば自動的に `DEFAULT_NODE_PARAMS` と `VISIONFY_FUNCTIONS_CONFIG` に反映される
- **フォールバックアダプタなし** — 汎用アダプタは存在せず、全関数を個別登録する必要がある
- **ルート名と関数名の違い** — アダプタのURLパスと `functionName` は独立しているため、バックエンドルートパスを必ず確認
