# ワークフロー永続化

## 概要

- Visionfy Demoはワークフローの保存・復元に2つの形式をサポート
- 簡易形式（SimpleWorkflow）と完全形式（FlowSnapshot）を自動判定してインポート可能
- JSONインポートモーダルから手動インポート、またはAIチャット経由でワークフロー生成が可能
- **統一的なI/Oサービス**（`WorkflowIOService`）ですべてのインポート・エクスポート操作を提供

## 2つの保存形式

### 簡易形式（SimpleWorkflow） — ユーザー編集推奨

- **用途**: AIチャット経由のワークフロー生成、JSONインポート、手動編集
- **型定義**: `frontend/lib/workflow/core/types.ts`
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
- **型定義**: `frontend/lib/workflow/core/types.ts`
- `nodes`, `edges`, `viewport` を含む完全な状態
- ランタイムデータ（`executionStatus`, `result`, `resultParams`, `icon`）は除外
- React Flowの状態を1:1で保存

**除外されるランタイムデータ**:
- `executionStatus` — ノードの実行状態（pending/running/success/error）
- `result` — 実行結果の画像（base64）
- `resultParams` — 実行時に使用されたパラメータ
- `icon` — ノードのアイコン名

## アーキテクチャ

```
frontend/lib/workflow/
├── core/
│   ├── types.ts          # 型定義の集約
│   ├── formats.ts        # 形式定義と定数
│   └── errors.ts         # カスタムエラークラス
│
├── converters/
│   ├── simpleToSnapshot.ts   # SimpleWorkflow → FlowSnapshot
│   ├── snapshotToSimple.ts   # FlowSnapshot → SimpleWorkflow
│   └── index.ts              # エクスポート
│
├── validators/
│   ├── simpleWorkflowValidator.ts  # SimpleWorkflow検証
│   ├── snapshotValidator.ts        # FlowSnapshot検証
│   └── index.ts                    # 形式検出・検証API
│
├── io/
│   ├── WorkflowIOService.ts    # 統一的なI/Oサービス
│   ├── WorkflowAIAdapter.ts    # AI連携専用アダプター
│   ├── utils.ts                # ユーティリティ関数
│   └── index.ts
│
└── index.ts              # ライブラリエントリポイント
```

### WorkflowIOService - 統一的なI/O API

すべてのワークフローインポート・エクスポート操作を統一的に提供：

```typescript
// インポート操作
WorkflowIOService.importFromJSON(json: string): FlowSnapshot
WorkflowIOService.importFromObject(data: unknown): FlowSnapshot

// エクスポート操作
WorkflowIOService.exportToJSON(snapshot: FlowSnapshot, format: ExportFormat): string
WorkflowIOService.exportToFile(entry: FlowHistoryEntry, format: ExportFormat): void
WorkflowIOService.exportMultipleToFiles(entries: FlowHistoryEntry[], format: ExportFormat): void

// 形式変換
WorkflowIOService.toSimpleWorkflow(snapshot: FlowSnapshot): SimpleWorkflow
WorkflowIOService.toFlowSnapshot(workflow: SimpleWorkflow): FlowSnapshot

// AI連携用
WorkflowIOService.createFromAIGeneration(simpleWorkflow: SimpleWorkflow): FlowSnapshot
```

### WorkflowAIAdapter - AI連携の明確化

AI機能とワークフローI/Oの連携を担当：

```typescript
// セッション登録（サーバーサイド）
WorkflowAIAdapter.registerSession(simpleWorkflow: SimpleWorkflow, sessionId: string): Promise<string>

// セッション取得（クライアントサイド）
WorkflowAIAdapter.retrieveFromSession(sessionId: string): Promise<SimpleWorkflow | null>

// AI生成ワークフロー適用
WorkflowAIAdapter.applyAIWorkflow(simpleWorkflow: SimpleWorkflow): Promise<{ sessionId, snapshot }>

// マーカー検出
WorkflowAIAdapter.extractSessionIds(content: string): string[]
```

## データフロー

### 変換フロー

- **SimpleWorkflow → FlowSnapshot**: `WorkflowIOService.toFlowSnapshot()` または `convertSimpleWorkflowToSnapshot()` で変換（START/ENDノード自動生成、位置計算、エッジ生成、デフォルトパラメータ補完）
- **FlowSnapshot → SimpleWorkflow**: `WorkflowIOService.toSimpleWorkflow()` または `convertSnapshotToSimpleWorkflow()` で変換（processNodeのみ抽出、functionName + params のみ保持）
- **FlowSnapshot → Stripped FlowSnapshot**: `stripRuntimeNodeData()` でランタイムデータ除去（永続化用）

### 永続化フロー

- **Stripped FlowSnapshot → localStorage**: `saveFlowSnapshot()` で保存（正規化適用、最大20件、新しいものが先頭）
- **localStorage → FlowSnapshot**: `loadFlowHistory()` で読み込み（バリデーション・正規化適用）

## インポート機能

- `WorkflowIOService.importFromJSON()` が統一的なインポートAPIを提供
- `frontend/hooks/useWorkflowImport.ts` がReact Hookとしてラップ
- `identifyWorkflowFormat()` で入力JSONを自動判定（`'simple'` / `'full'` / `'invalid'`）
- SimpleWorkflow → `convertSimpleWorkflowToSnapshot()` で変換後にキャンバスに適用
- FlowSnapshot → `normalizeSnapshot()` で正規化後にキャンバスに適用
- 不正なフォーマットの場合は `WorkflowImportError`（コード: `'PARSE_ERROR'` / `'INVALID_FORMAT'` / `'VALIDATION_ERROR'`）をスロー
- `frontend/app/components/workflow/JsonImportModal.tsx` でUIを提供

**使用例:**

```typescript
import { WorkflowIOService } from '@/lib/workflow';

try {
  const snapshot = WorkflowIOService.importFromJSON(jsonString);
  setNodes(snapshot.nodes);
  setEdges(snapshot.edges);
  setViewport(snapshot.viewport);
} catch (error) {
  if (error instanceof WorkflowImportError) {
    console.error(error.message, error.code);
  }
}
```

## AIチャット経由のワークフロー生成

- AIがユーザーの要求に基づき `generate_workflow` ツールを呼び出してワークフローを自動生成
- AIはSimpleWorkflow形式のJSON（`processNodes` 配列）をツール入力として生成
- サーバー側で `WorkflowAIAdapter.registerSession()` を呼び出してセッションストアに保存
- `[WORKFLOW_SESSION:sessionId]` マーカーをストリームに埋め込み
- フロントエンド（`ChatPanel`）がマーカーを検出
- `WorkflowAIAdapter.retrieveFromSession(sessionId)` でSimpleWorkflowを取得
- `WorkflowIOService.toFlowSnapshot()` で変換後にキャンバスに適用
- ツール実装: `frontend/lib/tools/generateWorkflowTool.ts`

**データフロー:**

```
1. AI → generate_workflow(simpleWorkflow)
2. WorkflowAIAdapter.registerSession(simpleWorkflow, sessionId)
3. POST /api/apply-workflow → SessionStore (5分TTL)
4. Return: "[WORKFLOW_SESSION:uuid]"
5. ChatPanel detects marker
6. WorkflowAIAdapter.retrieveFromSession(sessionId)
7. GET /api/apply-workflow?sessionId=uuid → SimpleWorkflow (one-time)
8. WorkflowIOService.toFlowSnapshot(simpleWorkflow)
9. setNodes(), setEdges(), setViewport()
```

## エクスポート機能

- `WorkflowIOService.exportToFile()` が単一エントリのエクスポートを提供
- `WorkflowIOService.exportMultipleToFiles()` が複数エントリの一括エクスポートを提供
- `frontend/lib/exportWorkflow.ts` が後方互換性のためのラッパー関数を提供
- `frontend/app/components/workflow/ExportModal.tsx` でUIを提供（簡易/完全形式の選択）

**使用例:**

```typescript
import { WorkflowIOService } from '@/lib/workflow';

// 単一エクスポート
WorkflowIOService.exportToFile(entry, 'simple');

// 複数エクスポート
WorkflowIOService.exportMultipleToFiles(entries, 'full');

// JSON文字列として取得
const json = WorkflowIOService.exportToJSON(snapshot, 'simple');
```

## バリデーション

すべてのバリデーション機能は `frontend/lib/workflow/validators/` に集約：

- `isSimpleWorkflow()` — `processNodes` が配列で各要素に文字列 `functionName` があることを検証
- `isValidSnapshot()` — 浅い構造チェック: `nodes` 配列、`edges` 配列、`viewport` がオブジェクト
- `validateHistoryEntry()` — エントリの `id`（文字列）、`createdAt`（文字列）、`snapshot`（有効なFlowSnapshot）を検証。`name` は未必須
- `identifyWorkflowFormat()` — SimpleWorkflow / FlowSnapshot / invalid を判定
- `isImportableWorkflow()` — SimpleWorkflow または FlowSnapshot であることを検証
- `validateWorkflow()` — 詳細な検証結果（`ValidationResult`）を返却

**使用例:**

```typescript
import { identifyWorkflowFormat, validateWorkflow } from '@/lib/workflow';

const format = identifyWorkflowFormat(data);
if (format === 'simple') {
  // SimpleWorkflow処理
} else if (format === 'full') {
  // FlowSnapshot処理
}

const result = validateWorkflow(data);
if (!result.isValid) {
  console.error('Validation errors:', result.errors);
}
```

## 後方互換性

- `normalizeSnapshot()` が `type: 'custom'` → `type: 'processNode'` への自動変換を実行（`frontend/lib/workflow/io/utils.ts`）
- `WorkflowIOService.importFromObject()` で自動的に正規化が適用される
- 既存の `useWorkflowImport`、`exportWorkflow` APIは後方互換性を維持（新サービスへ委譲）

## 制限事項

- スナップショット履歴は最大20件（古いものから自動削除）
- スナップショットIDは `snapshot-${Date.now()}` 形式（同一ミリ秒での衝突リスクあり）
- 実行履歴（`result`, `resultParams`）はスナップショットに含まれない（セッション単位で揮発）
- localStorage のストレージキーは `visionfy.flow.history`

## 主要な関連ファイル

### Workflowモジュール（新アーキテクチャ）

**Core層（型・定数・エラー）:**
- `frontend/lib/workflow/core/types.ts` — 型定義の集約（`SimpleWorkflow`, `FlowSnapshot`, `ExportFormat`など）
- `frontend/lib/workflow/core/formats.ts` — 形式定義、サンプル、定数
- `frontend/lib/workflow/core/errors.ts` — カスタムエラークラス（`WorkflowImportError`, `WorkflowExportError`など）

**Converters層（形式変換）:**
- `frontend/lib/workflow/converters/simpleToSnapshot.ts` — SimpleWorkflow → FlowSnapshot変換
- `frontend/lib/workflow/converters/snapshotToSimple.ts` — FlowSnapshot → SimpleWorkflow変換
- `frontend/lib/workflow/converters/index.ts` — エクスポート

**Validators層（検証）:**
- `frontend/lib/workflow/validators/simpleWorkflowValidator.ts` — SimpleWorkflow検証
- `frontend/lib/workflow/validators/snapshotValidator.ts` — FlowSnapshot検証
- `frontend/lib/workflow/validators/index.ts` — 形式検出・検証API

**I/O層（サービス）:**
- `frontend/lib/workflow/io/WorkflowIOService.ts` — 統一的なI/Oサービス（インポート・エクスポートの中心）
- `frontend/lib/workflow/io/WorkflowAIAdapter.ts` — AI連携専用アダプター（セッション管理）
- `frontend/lib/workflow/io/utils.ts` — ユーティリティ関数（ランタイムデータ除去、正規化）
- `frontend/lib/workflow/io/index.ts` — エクスポート

**エントリポイント:**
- `frontend/lib/workflow/index.ts` — ライブラリエントリポイント（全機能のエクスポート）

### 従来のファイル（後方互換性のためのラッパー）

- `frontend/hooks/useWorkflowImport.ts` — `WorkflowIOService`へ委譲
- `frontend/lib/exportWorkflow.ts` — `WorkflowIOService`へ委譲
- `frontend/types/workflowPersistence.ts` — 型定義（一部は`lib/workflow/core/types.ts`に移行）
- `frontend/workflow/workflowConverter.ts` — 形式変換（非推奨、新モジュール使用を推奨）
- `frontend/workflow/workflowValidator.ts` — 検証（非推奨、新モジュール使用を推奨）
- `frontend/workflow/flowPersistence.ts` — localStorage操作（保存・読込・削除・履歴管理）
- `frontend/workflow/flowStore.tsx` — React Context状態管理

### Hook

- `frontend/hooks/useSnapshotHistory.ts` — スナップショット履歴CRUD

### ツール

- `frontend/lib/tools/generateWorkflowTool.ts` — `generate_workflow` ツール実装（`WorkflowAIAdapter`使用）

### UI

- `frontend/app/components/workflow/JsonImportModal.tsx` — JSONインポートモーダル
- `frontend/app/components/workflow/ExportModal.tsx` — JSONエクスポートモーダル
- `frontend/app/components/workflow/SnapshotDropdown.tsx` — スナップショット履歴ドロップダウン

## 関連ドキュメント

- [AIチャット機能](./AI.md) — `generate_workflow` ツールを含むAIツールシステム
