---
paths:
  - "frontend/app/api/chat/**"
  - "frontend/app/api/apply-workflow/**"
  - "frontend/app/api/image-session/**"
  - "frontend/lib/chatService.ts"
  - "frontend/lib/chatPrompts.ts"
  - "frontend/lib/chatStorageService.ts"
  - "frontend/lib/tools/**"
  - "frontend/hooks/useChatThreads.ts"
  - "frontend/app/components/chat/**"
---

# AIチャット機能

Gemini 2.5 Pro + LangChain ベース。ストリーミングレスポンス内にツール呼び出しマーカーを差し込んで進行を可視化する。

権威ドキュメント:
- 機能全体: [docs/features/AI.md](../../docs/features/AI.md)
- ツール追加方法: [frontend/lib/tools/README.md](../../frontend/lib/tools/README.md)
- AI 概要: [ai/overview/ai-chat.md](../../ai/overview/ai-chat.md)

## 重要な設計判断

- **Two-hop proxy**: Browser → Next.js (`/api/chat`) → Gemini。`GEMINI_API_KEY` はサーバーサイドのみ。
- **ストリーム形式**: `text/plain` の `ReadableStream`（SSEではない）。中途エラーは同一ストリームにテキスト追加し HTTP 200 を維持するため、クライアント側は失敗判別不可。
- **ツール呼び出しマーカー**: ストリーム内に `<<TOOL_START:name>>` / `<<TOOL_END:name>>` を挿入、フロントが `MessageContent.tsx` で解析して `ToolCallIndicator` を描画。
- **ツールレジストリパターン**: `lib/tools/registry.ts` の `TOOL_REGISTRY` にエントリ追加するだけで新ツール導入可能（`factory` + 任意の `isEnabled`）。

## 登録済みツール（4種）

| Tool | 説明 | 実装 |
|------|------|------|
| `get_available_nodes` | 利用可能な処理関数一覧 + デフォルト値 | `lib/tools/availableNodesTool.ts` |
| `get_workflow_context` | 現在のノード構成・接続・実行結果 | `lib/tools/workflowContextTool.ts` |
| `generate_workflow` | SimpleWorkflow JSON からキャンバスへ適用 | `lib/tools/generateWorkflowTool.ts` |
| `get_image` | 元画像・各ノード結果画像をAIが取得 | `lib/tools/getImageTool.ts` |

## セッションベース受け渡しパターン

`generate_workflow` と `get_image` は大きなペイロードをストリームに直接乗せず、内部API（`/api/apply-workflow`, `/api/image-session`）にサーバー側で保存し `[WORKFLOW_SESSION:id]` / `[IMAGE_SESSION:id]` マーカーを返す。フロントエンド (`ChatPanel`) がマーカー検出→セッションAPIで取得→キャンバス適用 or 再ターン開始。

## スレッド・プロンプト

- スレッド管理: `hooks/useChatThreads.ts` ↔ `lib/chatStorageService.ts`（localStorage、画像 base64 は保存時に除去）。
- システムプロンプト: `lib/chatPrompts.ts` + `buildImageContext()` で利用可能画像一覧を動的に付加。ユーザーがカスタム上書き可能（localStorage 永続化）。
- 共有データソース: `PROCESS_FUNCTIONS_BASE` → `NODE_DESCRIPTIONS` が AI プロンプトと `get_available_nodes` ツールの両方で利用される。
