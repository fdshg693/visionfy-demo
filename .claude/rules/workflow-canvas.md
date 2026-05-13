---
paths:
  - "frontend/app/page.tsx"
  - "frontend/app/components/workflow/**"
  - "frontend/app/components/nodes/**"
  - "frontend/app/components/inspectors/**"
  - "frontend/workflow/**"
  - "frontend/constants/**"
  - "frontend/hooks/useWorkflowExecution.ts"
  - "frontend/contexts/**"
  - "frontend/types/processFunction*.ts"
  - "frontend/types/processNode.ts"
---

# ワークフローキャンバス

React Flow ベースのキャンバスで Start / Process / End の線形パイプラインを構築する機能。

権威ドキュメント: [docs/features/CANVAS.md](../../docs/features/CANVAS.md)

## 設計上の重要ポイント

- **接続制約**: `getConnectionConstraintError`（`workflow/connectionConstraints.ts`）が **1入力1出力** を強制。分岐不可。
- **実行フロー**: `useWorkflowExecution` → `buildNodeChain`（`workflow/workflowChain.ts`、ループ検出付き）→ 逐次 `POST /api/process-node`。
- **Single Source of Truth**: `frontend/types/processFunctionBase.ts` の `PROCESS_FUNCTIONS_BASE` から `VISIONFY_FUNCTIONS_CONFIG` / `DEFAULT_NODE_PARAMS` / `DEFAULT_NODE_ICONS` / `NODE_DESCRIPTIONS` が自動導出される。新関数追加時は **ここに足すだけ** で UI フォームが自動生成される。
- **2層コンテキスト**: `FlowStoreContext`（ノード/エッジ/ビューポートのグローバル状態）+ `InspectorContext`（ファイル/結果/実行トリガ、prop drilling 回避）+ `ToastContext`。
- **ノード追加時のデフォルト関数**は `createclahe` にハードコード（`constants/flowConfig.ts` の `handleAddNode`）。
- **ProcessNodeData は判別共用体**（7バリアント、キーは `functionName`）。新関数追加時は [[backend-api]] を参照。

## ノード型と主要ファイル

- `app/components/nodes/`: `StartNode`, `ProcessNode`(+ Header/Body/HoverPopup/ParamInputs), `EndNode`, `paramFields/`（5種: Boolean/Number/Select/Text/Tuple、動的レンダリング）
- `app/components/inspectors/`: `ProcessNodeInspector`（関数選択・パラメータ編集）, `ResultNodeInspector`, `tabs/`
- `app/components/workflow/`: `FlowCanvas`, `InputImagePanel`, `JsonImportModal`, `UsageGuidePanel`, `SnapshotPanel`, `GenerateCodeModal`

非自明な振る舞い（fitView がスナップショットのviewportを上書きする等）は [[frontend-internals]] を参照。
