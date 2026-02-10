# ワークフローキャンバス機能

## 機能概要

- React Flowベースのワークフローキャンバスで画像処理パイプラインを構築
- Start / Process / End の3種のカスタムノードを使用
- 処理ノードを動的に追加・編集・連結・削除可能
- 7種の処理関数に対応: CLAHE, GaussianBlur, Grayscale, RemoveNoise, RestoreBrightness, RestoreContrast, ModelInference
- バックエンドFlask APIに画像を送信し、処理結果を受け取る
- 接続制約: 1ノードにつき1入力1出力の線形パイプライン
- JSONインポートによるワークフロー読み込み対応（簡易形式・完全形式の自動判定）
- 使い方ガイドパネル表示機能あり

## 全体構造

- UI: `page.tsx` → FlowCanvas（React Flow）+ InspectorPanel + ChatPanel + JsonImportModal + UsageGuidePanel
- 状態管理: FlowStoreProvider（ノード/エッジ/ビューポート）+ InspectorContext（ファイル/結果/実行）+ ToastContext（通知）
- 実行フロー: `useWorkflowExecution` → `buildNodeChain` → POST `/api/process-node`（Next.js）→ `BackendApiService` → adapter → Flask API
- 接続制約: `getConnectionConstraintError` が1入力1出力を強制
- 型安全: `ProcessNodeData` は `functionName` をキーにした判別共用体（7バリアント）
- Single Source of Truth: `PROCESS_FUNCTIONS_BASE` から全関数メタデータ・UIパラメータ・デフォルト値を自動導出
- ノード追加時のデフォルトは `createclahe`（`handleAddNode` 内にハードコード）

## 設計上の特徴

- **Two-hop proxy**: Browser → Next.js Route → Flask（バックエンドURLはサーバーサイドのみ）
- **アダプタパターン**: 関数ごとにFormData構築ロジックを分離（7アダプタ登録済み）
- **2層コンテキスト**: FlowStoreContext（グローバル状態）+ InspectorContext（読み取り/実行専用）+ ToastContext（通知）
- **SSRガード**: `isHydrated` が `true` になるまで `null` を描画（localStorage不一致防止）
- **Single Source of Truth**: `processFunctionBase.ts` の `PROCESS_FUNCTIONS_BASE` から `VISIONFY_FUNCTIONS_CONFIG`, `DEFAULT_NODE_PARAMS`, `DEFAULT_NODE_ICONS` を自動生成
- **構造化エラーハンドリング**: `ValidationError`, `ProcessingError`, `NetworkError` の階層 + `categorizeError()` ユーティリティ

## 主要な関連ファイル

### ページ・キャンバス

- `frontend/app/page.tsx` — ルートページ。キャンバス・インスペクタ・チャットパネル・モーダルの統合、SSRガード（Hydration）
- `frontend/app/components/workflow/FlowCanvas.tsx` — React Flowキャンバス本体
- `frontend/constants/flowConfig.ts` — デフォルトノード構成・カスタムノードタイプマッピング

### ノードコンポーネント

- `frontend/app/components/nodes/StartNode.tsx` — 開始ノードコンポーネント
- `frontend/app/components/nodes/ProcessNode.tsx` — 処理ノードのカスタムコンポーネント
- `frontend/app/components/nodes/ProcessNodeBody.tsx` — 処理ノードの本体部分
- `frontend/app/components/nodes/ProcessNodeHeader.tsx` — 処理ノードのヘッダー部分
- `frontend/app/components/nodes/ProcessNodeHoverPopup.tsx` — ホバー時のBefore/Afterプレビューポップアップ
- `frontend/app/components/nodes/ProcessNodeParamInputs.tsx` — `VISIONFY_FUNCTIONS_CONFIG` からの動的パラメータフォーム生成
- `frontend/app/components/nodes/EndNode.tsx` — 終了ノードコンポーネント
- `frontend/app/components/nodes/paramFields/` — 5種のパラメータフィールドコンポーネント（Boolean, Number, Select, Text, Tuple）

### インスペクタ・パネル

- `frontend/app/components/workflow/InputImagePanel.tsx` — 画像アップロード・ワークフロー実行
- `frontend/app/components/inspectors/ResultNodeInspector.tsx` — 結果表示インスペクタ（Before/After比較・実行履歴）
- `frontend/app/components/inspectors/tabs/ExecutionHistoryTab.tsx` — 実行履歴タブ
- `frontend/app/components/inspectors/tabs/ResultComparisonTab.tsx` — 結果比較タブ
- `frontend/app/components/inspectors/tabs/PipelineArrow.tsx` — パイプライン矢印UI
- `frontend/app/components/inspectors/tabs/PipelineImage.tsx` — パイプライン画像表示
- `frontend/app/components/workflow/ProcessNodePopup.tsx` — ProcessNode設定編集用ポップアップ
- `frontend/app/components/inspectors/ProcessNodeInspector.tsx` — 関数選択・パラメータ編集（ポップアップ内で使用）
- `frontend/contexts/InspectorContext.tsx` — インスペクタ用コンテキスト（prop drilling回避）

### ワークフロー管理UI

- `frontend/app/components/workflow/SnapshotPanel.tsx` — スナップショット管理パネル
- `frontend/app/components/workflow/SnapshotDropdown.tsx` — スナップショット選択ドロップダウン
- `frontend/app/components/workflow/JsonImportModal.tsx` — JSONワークフローインポートモーダル
- `frontend/app/components/workflow/UsageGuidePanel.tsx` — 使い方ガイドパネル

### 状態管理・ワークフロー

- `frontend/workflow/flowStore.tsx` — FlowStoreContext: ノード/エッジ/ビューポートの状態管理
- `frontend/workflow/connectionConstraints.ts` — 接続バリデーション（1入力1出力の線形制約）
- `frontend/workflow/workflowChain.ts` — `buildNodeChain()`: Startノードからエッジを辿り実行チェーン構築（ループ検出付き）

### 型定義

- `frontend/types/processFunctionBase.ts` — 全関数メタデータの一元定義（Single Source of Truth）
- `frontend/types/processFunction.ts` — `VISIONFY_FUNCTIONS_CONFIG`（UIパラメータ設定、`processFunctionBase` から自動導出）
- `frontend/types/processNode.ts` — `ProcessNodeData` 判別共用体（7バリアント）・パラメータ型・デフォルト値・アイコン

### 実行・API連携

- `frontend/hooks/useWorkflowExecution.ts` — ワークフロー実行hook（チェーン構築→逐次API呼び出し→ステータス更新）
- `frontend/app/api/process-node/route.ts` — Next.js APIルート（BackendApiServiceへのプロキシ、構造化ログ付き）
- `frontend/lib/backendApiService.ts` — Flask APIへのプロキシサービス（アダプタ選択・レスポンス正規化）
- `frontend/lib/backendApiAdapters.ts` — 関数別リクエストアダプタ（7種、FormData構築）
- `frontend/lib/errors.ts` — 構造化エラー定義（`ValidationError`, `ProcessingError`, `NetworkError`, `categorizeError`）

### バックエンド

- `backend/src/main.py` — Flask APIエントリポイント（ルート登録）
- `backend/src/api/createclahe/main.py` — CLAHE処理
- `backend/src/api/gaussian_blur/main.py` — ガウシアンブラー処理
- `backend/src/api/grayscale/main.py` — グレースケール処理
- `backend/src/api/remove_noise/main.py` — ノイズ除去処理
- `backend/src/api/restore_brightness/main.py` — 明るさ復元処理
- `backend/src/api/restore_contrast/main.py` — コントラスト復元処理
- `backend/src/api/model_inference/main.py` — モデル推論処理（Patchcore）
