# AIチャット機能

## 概要

- Gemini 2.5 Pro を使用したAIチャット機能
- スレッドごとに会話を整理し、localStorageで永続化
- AIがツール（`get_workflow_context`）を自律的に呼び出し、ワークフローの状態を取得可能
- ストリーミングレスポンス（`text/plain` の `ReadableStream`、SSEではない）

## 全体構造

- Browser (`ChatPanel`) → `POST /api/chat` (Next.js API Route) → `ChatService` → LangChain Agent (`gemini-2.5-pro`) → ストリーミングレスポンス
- AIは `get_workflow_context` ツールを自律的に呼び出してキャンバス状態を取得可能
- スレッド管理: `useChatThreads` ↔ `chatStorageService` ↔ `localStorage`

## 主要な関連ファイル

- `frontend/app/api/chat/route.ts` — Next.js APIルート。ChatServiceを呼び出しストリーミングレスポンスを返す
- `frontend/lib/chatService.ts` — Geminiモデルの初期化・エージェント作成・ストリーミング実行
- `frontend/lib/chatPrompts.ts` — システムプロンプト定義 + `buildWorkflowContext()` でキャンバス状態をMarkdown化
- `frontend/lib/chatStorageService.ts` — スレッドのlocalStorage永続化（CRUD + タイトル自動生成）
- `frontend/app/components/chat/ChatPanel.tsx` — チャットUI本体（入力・メッセージ一覧・ストリーミング表示・リサイズ対応）
- `frontend/app/components/chat/ChatMarkdown.tsx` — AIメッセージのMarkdownレンダリング（react-markdown + remark-gfm）
- `frontend/app/components/chat/ThreadMenu.tsx` — スレッド切り替え・作成・削除のドロップダウンUI
- `frontend/hooks/useChatThreads.ts` — スレッドCRUD・メッセージ管理・アクティブスレッド切替のhook
- `frontend/lib/tools/index.ts` — ツールモジュールのバレルエクスポート
- `frontend/lib/tools/registry.ts` — ツールレジストリ（現在 `get_workflow_context` のみ登録）
- `frontend/lib/tools/types.ts` — `ToolContext`, `ToolFactory`, `ToolRegistryEntry` 型定義
- `frontend/lib/tools/workflowContextTool.ts` — `get_workflow_context` ツールの実装（`buildWorkflowContext` に委譲）

## 設計上の特徴

- **Two-hop proxy**: Browser → Next.js → Gemini（APIキーはサーバーサイドのみで管理）
- **ツールレジストリパターン**: 新ツール追加は `TOOL_REGISTRY` にエントリ追加のみで対応可能
- **ストリーミング**: `text/plain` の `ReadableStream`（SSEではない）。中途エラーは同一ストリームにテキスト追加（HTTP 200維持）
- **スレッド永続化**: 全てクライアントサイド（localStorage）。メッセージ追加・スレッド切替時に自動保存