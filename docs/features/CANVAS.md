# ワークフローキャンバス機能

## 機能概要

- React Flowベースのワークフローキャンバスで画像処理パイプラインを構築
- Start / Process / End の3種のカスタムノードを使用
- 処理ノードを動的に追加・編集・連結・削除可能
- 各処理ノードはOpenCV関数（CLAHE / GaussianBlur / Grayscale）に対応
- バックエンドFlask APIに画像を送信し、処理結果を受け取る
- 接続制約: 1ノードにつき1入力1出力の線形パイプライン

## 全体構造

- UI: `page.tsx` → FlowCanvas（React Flow）+ InspectorPanel
- 状態管理: FlowStoreProvider（ノード/エッジ/ビューポート）+ InspectorContext（ファイル/結果/実行）
- 実行フロー: `useWorkflowExecution` → `buildNodeChain` → POST `/api/process-node`（Next.js）→ `BackendApiService` → adapter → Flask API
- 接続制約: `getConnectionConstraintError` が1入力1出力を強制
- 型安全: `ProcessNodeData` は `functionName` をキーにした判別共用体
- ノード追加時のデフォルトは `createclahe`（`handleAddNode` 内にハードコード）

## 設計上の特徴

- **Two-hop proxy**: Browser → Next.js Route → Flask（バックエンドURLはサーバーサイドのみ）
- **アダプタパターン**: 関数ごとにFormData構築ロジックを分離
- **2層コンテキスト**: FlowStoreContext（グローバル状態）+ InspectorContext（読み取り/実行専用）
- **SSRガード**: `isHydrated` が `true` になるまで `null` を描画（localStorage不一致防止）

## 主要な関連ファイル

### ページ・キャンバス

- `frontend/app/page.tsx` — ルートページ。キャンバス・インスペクタ・チャットパネルの統合、SSRガード
- `frontend/constants/flowConfig.ts` — デフォルトノード構成・カスタムノードタイプマッピング

### ノードコンポーネント

- `frontend/app/components/nodes/StartNode.tsx` — 開始ノードコンポーネント
- `frontend/app/components/nodes/ProcessNode.tsx` — 処理ノードのカスタムコンポーネント
- `frontend/app/components/nodes/EndNode.tsx` — 終了ノードコンポーネント

### インスペクタ

- `frontend/app/components/inspectors/StartNodeInspector.tsx` — 画像アップロード・ワークフロー実行
- `frontend/app/components/inspectors/ProcessNodeInspector.tsx` — 関数選択・パラメータ編集・結果表示
- `frontend/app/components/inspectors/EndNodeInspector.tsx` — Before/After比較・実行履歴
- `frontend/contexts/InspectorContext.tsx` — インスペクタ用コンテキスト（prop drilling回避）

### 状態管理・ワークフロー

- `frontend/workflow/flowStore.tsx` — FlowStoreContext: ノード/エッジ/ビューポートの状態管理
- `frontend/workflow/connectionConstraints.ts` — 接続バリデーション（1入力1出力の線形制約）
- `frontend/workflow/workflowChain.ts` — `buildNodeChain()`: Startノードからエッジを辿り実行チェーン構築

### 型定義

- `frontend/types/node.ts` — `ProcessNodeData` の判別共用体・パラメータ型・デフォルト値

### 実行・API連携

- `frontend/hooks/useWorkflowExecution.ts` — ワークフロー実行hook（チェーン構築→逐次API呼び出し→ステータス更新）
- `frontend/app/api/process-node/route.ts` — Next.js APIルート（BackendApiServiceへのプロキシ）
- `frontend/lib/backendApiService.ts` — Flask APIへのプロキシサービス（アダプタ選択・レスポンス正規化）
- `frontend/lib/backendApiAdapters.ts` — 関数別リクエストアダプタ（FormData構築）

### バックエンド

- `backend/src/main.py` — Flask APIエントリポイント（ルート登録）
- `backend/src/api/createclahe/main.py` — CLAHE処理
- `backend/src/api/gaussian_blur/main.py` — ガウシアンブラー処理
- `backend/src/api/grayscale/main.py` — グレースケール処理