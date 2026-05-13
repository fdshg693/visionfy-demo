---
paths:
  - "frontend/lib/workflow/**"
  - "frontend/workflow/flowPersistence.ts"
  - "frontend/workflow/flowSerializer.ts"
  - "frontend/workflow/workflowConverter.ts"
  - "frontend/workflow/workflowValidator.ts"
  - "frontend/hooks/useWorkflowImport.ts"
  - "frontend/hooks/useSnapshotHistory.ts"
  - "frontend/lib/exportWorkflow.ts"
  - "frontend/types/workflowPersistence.ts"
  - "frontend/app/components/workflow/JsonImportModal.tsx"
  - "frontend/app/components/workflow/ExportModal.tsx"
---

# ワークフロー保存・インポート・エクスポート

権威ドキュメント: [docs/features/WORKFLOW_PERSISTENCE.md](../../docs/features/WORKFLOW_PERSISTENCE.md)

## 2 つの形式

| 形式 | 用途 | 内容 |
|------|------|------|
| **SimpleWorkflow** | AIワークフロー生成、JSONインポート、ユーザー編集 | `processNodes: [{ functionName, params? }]` のみ |
| **FlowSnapshot** | localStorage、スナップショット履歴、完全復元 | `nodes` / `edges` / `viewport`（runtime データ除く） |

`identifyWorkflowFormat()` が自動判定し、`'simple'` / `'full'` / `'invalid'` を返す。

## 統一 I/O サービス

すべてのインポート・エクスポートは `frontend/lib/workflow/io/WorkflowIOService.ts` 経由で行う:
- `WorkflowIOService.importFromJSON(json)` → `FlowSnapshot`
- `WorkflowIOService.toFlowSnapshot(simpleWorkflow)` / `toSimpleWorkflow(snapshot)`
- `WorkflowIOService.exportToFile(entry, format)` / `exportToJSON(snapshot, format)`

AI 連携は `WorkflowAIAdapter`（セッションベース。`/api/apply-workflow` 経由でセッションIDを発行・取得）。[[ai-chat]] と `generate_workflow` ツール参照。

## 永続化の重要事項

- ストレージキー: `visionfy.flow.history`、**最大20件**（古いものから自動削除、新しいものが先頭）。
- スナップショットID: `snapshot-${Date.now()}`（同一ms衝突リスクあり）。
- 保存時に剥がされるランタイムデータ: `executionStatus`, `result`, `resultParams`, `icon`。
- `normalizeSnapshot()` が後方互換変換を実行（`type: 'custom'` → `type: 'processNode'`）。
- `frontend/workflow/workflowConverter.ts` / `workflowValidator.ts` は非推奨ラッパー。新規コードは `lib/workflow/` を使う。

## Pythonコード生成

`GenerateCodeModal` から現在のワークフローを SimpleWorkflow に変換し `POST /api/generate-code` → Flask `POST /api/generate_code` でスタンドアロン Python スクリプトを生成（`model_inference` はスキップ＋コメント）。
