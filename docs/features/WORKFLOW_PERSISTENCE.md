# ワークフロー永続化

## 概要

- Visionfy Demoはワークフローの保存・復元に2つの形式をサポート
- 簡易形式（SimpleWorkflow）と完全形式（FlowSnapshot）を自動判定してインポート可能
- JSONインポートモーダルから手動インポート、またはAIチャット経由でワークフロー生成が可能

## 2つの保存形式

### 簡易形式（SimpleWorkflow） — ユーザー編集推奨

- **用途**: AIチャット経由のワークフロー生成、JSONインポート、手動編集
- **型定義**: `frontend/types/simpleWorkflow.ts`
- 最小限の情報（`functionName` + `params`）のみ記述
- ノード位置、エッジ、viewportは自動計算
- `params` 省略時はデフォルト値（`DEFAULT_NODE_PARAMS`）を使用
- `processNodes` 配列に処理ノードを順番に定義するだけで線形パイプラインが構成される

**自動補完される項目**:
- ノード位置（水平方向に150px間隔、y=150固定）
- START/ENDノードの自動生成
- エッジの自動接続（線形パイプライン）
- デフォルトviewport（zoom: 1, x: 0, y: 0）
- ノードID（`node-{Date.now()}-{index}` 形式）

### 完全形式（FlowSnapshot） — 内部ストレージ形式

- **用途**: localStorage保存、スナップショット履歴、完全な状態復元
- **型定義**: `frontend/types/workflowPersistence.ts`
- `nodes`, `edges`, `viewport` を含む完全な状態
- ランタイムデータ（`executionStatus`, `result`, `resultParams`, `icon`）は除外
- React Flowの状態を1:1で保存

**除外されるランタイムデータ**:
- `executionStatus` — ノードの実行状態（pending/running/success/error）
- `result` — 実行結果の画像（base64）
- `resultParams` — 実行時に使用されたパラメータ
- `icon` — ノードのアイコン名

## データフロー

- **SimpleWorkflow → FlowSnapshot**: `convertSimpleWorkflowToSnapshot()` で変換（START/ENDノード自動生成、位置計算、エッジ生成、デフォルトパラメータ補完）
- **FlowSnapshot → SimpleWorkflow**: `convertSnapshotToSimpleWorkflow()` で変換（processNodeのみ抽出、functionName + params のみ保持）
- **FlowSnapshot → Stripped FlowSnapshot**: `stripRuntimeNodeData()` でランタイムデータ除去（永続化用）
- **Stripped FlowSnapshot → localStorage**: `saveFlowSnapshot()` で保存（正規化適用、最大20件、新しいものが先頭）
- **localStorage → FlowSnapshot**: `loadFlowHistory()` で読み込み（バリデーション・正規化適用）

## インポート機能

- `frontend/hooks/useWorkflowImport.ts` がインポートロジックを提供
- `identifyWorkflowFormat()` で入力JSONを自動判定（`'simple'` / `'full'` / `'invalid'`）
- SimpleWorkflow → `convertSimpleWorkflowToSnapshot()` で変換後にキャンバスに適用
- FlowSnapshot → `normalizeSnapshot()` で正規化後にキャンバスに適用
- 不正なフォーマットの場合は `WorkflowImportError`（コード: `'PARSE_ERROR'` / `'INVALID_FORMAT'`）をスロー
- `frontend/app/components/workflow/JsonImportModal.tsx` でUIを提供

## バリデーション

- `isSimpleWorkflow()` — `processNodes` が配列で各要素に文字列 `functionName` があることを検証
- `isValidSnapshot()` — 浅い構造チェック: `nodes` 配列、`edges` 配列、`viewport` がオブジェクト
- `validateHistoryEntry()` — エントリの `id`（文字列）、`createdAt`（文字列）、`snapshot`（有効なFlowSnapshot）を検証。`name` は未必須
- `identifyWorkflowFormat()` — SimpleWorkflow / FlowSnapshot / invalid を判定
- `isImportableWorkflow()` — SimpleWorkflow または FlowSnapshot であることを検証

## 後方互換性

- `normalizeSnapshot()` が `type: 'custom'` → `type: 'processNode'` への自動変換を実行
- 保存時と読み込み時の両方で正規化が適用される

## 制限事項

- スナップショット履歴は最大20件（古いものから自動削除）
- スナップショットIDは `snapshot-${Date.now()}` 形式（同一ミリ秒での衝突リスクあり）
- 実行履歴（`result`, `resultParams`）はスナップショットに含まれない（セッション単位で揮発）
- localStorage のストレージキーは `visionfy.flow.history`

## 主要な関連ファイル

### 型定義

- `frontend/types/simpleWorkflow.ts` — `SimpleWorkflow`, `SimpleProcessNode` 型定義 + `isSimpleWorkflow` 型ガード
- `frontend/types/workflowPersistence.ts` — `FlowSnapshot`, `FlowHistoryEntry`, `PersistedFlowHistory`, `ImportableWorkflow` 型定義
- `frontend/types/workflow.ts` — `WorkflowFile` 型定義（`{ file: File }`）

### 変換・バリデーション

- `frontend/workflow/workflowConverter.ts` — 形式変換ロジック集約（SimpleWorkflow ↔ FlowSnapshot、ランタイムデータ除去、正規化）
- `frontend/workflow/workflowValidator.ts` — 検証ロジック集約（`isValidSnapshot`, `validateHistoryEntry`, `identifyWorkflowFormat`, `isImportableWorkflow`）
- `frontend/workflow/flowPersistence.ts` — localStorage 操作（保存・読込・削除・履歴管理）
- `frontend/workflow/flowStore.tsx` — React Context 状態管理

### Hook

- `frontend/hooks/useWorkflowImport.ts` — JSONインポートロジック（形式自動判定 + 変換）
- `frontend/hooks/useSnapshotHistory.ts` — スナップショット履歴CRUD

### UI

- `frontend/app/components/workflow/JsonImportModal.tsx` — JSONインポートモーダル

## 関連ドキュメント

- [スナップショット機能](./SNAPSHOT.md) — 履歴保存・復元のUI操作
