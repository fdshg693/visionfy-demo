# AIチャット機能

## 概要

- Gemini 2.5 Pro を使用したAIチャット機能
- スレッドごとに会話を整理し、localStorageで永続化
- AIがツール（`get_workflow_context`, `get_available_nodes`, `generate_workflow`, `get_image`）を自律的に呼び出し、ワークフローの状態取得やワークフロー生成、画像確認が可能
- ストリーミングレスポンス（`text/plain` の `ReadableStream`、SSEではない）
- ストリーム内にツール呼び出しマーカー（`<<TOOL_START:name>>` / `<<TOOL_END:name>>`）を含む
- マルチ画像添付に対応（base64エンコード、保存時にbase64を除去して軽量化）
- カスタムシステムプロンプトの編集・保存・リセット機能あり（localStorageに永続化）

## 全体構造

- Browser (`ChatPanel`) → `POST /api/chat` (Next.js API Route) → `ChatService` → LangChain Agent (`gemini-2.5-pro`) → ストリーミングレスポンス
- エージェント作成: `createAgent` (langchain) でモデル・ツール・システムプロンプトを統合
- AIは登録済みツールを自律的に呼び出してキャンバス状態やノード情報を取得可能
- スレッド管理: `useChatThreads` ↔ `chatStorageService` ↔ `localStorage`

## ツールシステム

- **ツールレジストリパターン**: `TOOL_REGISTRY` に `ToolRegistryEntry` を追加するだけで新ツールを導入可能
- 各ツールは `ToolFactory` 関数と `isEnabled` ガードで構成
- `ToolContext` にはノード・エッジ・元画像（base64）・ノード実行結果（nodeResults）を含む

### 登録済みツール

- **`get_workflow_context`** — 現在のワークフロー状態（ノード構成・接続・実行結果）をMarkdown形式で返す
  - ワークフローにノードが存在する場合のみ有効
  - `buildWorkflowContext()` に委譲
- **`get_available_nodes`** — 利用可能な全処理ノードの一覧（関数名・アイコン・説明・パラメータ・デフォルト値）を返す
  - 常に有効（コンテキスト不要）
  - `PROCESS_FUNCTIONS_BASE` から `NODE_DESCRIPTIONS` を導出（AIプロンプトとの共有データソース）
- **`generate_workflow`** — SimpleWorkflow形式のJSONからワークフローを生成してキャンバスに適用する
  - 常に有効
  - AIが `processNodes` 配列（`functionName` + 任意の `params`）を指定
  - ツール実行時にバリデーション後、内部API（`/api/apply-workflow`）にセッション保存
  - ストリーム内に `[WORKFLOW_SESSION:sessionId]` マーカーを含むテキストを返却
  - フロントエンド（`ChatPanel`）がストリーム完了後にセッションAPIからワークフローを取得し、`convertSimpleWorkflowToSnapshot()` で変換後にキャンバスに適用
- **`get_image`** — ワークフローの画像（元画像・各ノードの処理結果）を取得してAIが確認する
  - 元画像またはノード実行結果が存在する場合のみ有効
  - AIが `imageIndex`（0始まり）を指定して画像を選択
  - 利用可能な画像一覧はシステムプロンプトに動的に付加される（`buildImageContext()`）
  - セッションベースの予約パターン: ツールが内部API（`/api/image-session`）に画像データを保存し、`[IMAGE_SESSION:sessionId]` マーカーを返却
  - フロントエンド（`ChatPanel`）がストリーム完了後にセッションAPIから画像を取得し、ユーザーメッセージとして追加した上で再度AIターンを開始

## チャットUIコンポーネント

- `frontend/app/components/chat/ChatPanel.tsx` — チャットUI本体。全サブコンポーネントを統合し、ストリーミングfetch・状態管理を実行
- `frontend/app/components/chat/ChatInputArea.tsx` — テキスト入力エリア（Enter送信・ファイル添付連携）
- `frontend/app/components/chat/ChatMessageList.tsx` — メッセージ一覧表示・自動スクロール
- `frontend/app/components/chat/MessageContent.tsx` — ストリーム内のツールマーカーを解析し、Markdownと `ToolCallIndicator` を交互に描画
- `frontend/app/components/chat/ToolCallIndicator.tsx` — ツール呼び出しインジケーター（レンチアイコン + 日本語名表示）
- `frontend/app/components/chat/ToolList.tsx` — 登録済みツール一覧を表示するドロップダウン（`TOOL_REGISTRY` から取得）
- `frontend/app/components/chat/ChatMarkdown.tsx` — AIメッセージのMarkdownレンダリング（react-markdown + remark-gfm）
- `frontend/app/components/chat/ChatSettingsPanel.tsx` — カスタムシステムプロンプト編集UI（保存・リセット）
- `frontend/app/components/chat/FileAttachmentManager.tsx` — マルチ画像添付（ファイル選択・base64変換・プレビュー・削除）
- `frontend/app/components/chat/ThreadMenu.tsx` — スレッド切り替え・作成・削除のドロップダウンUI

## 主要な関連ファイル

### APIルート・サービス

- `frontend/app/api/chat/route.ts` — Next.js APIルート。ChatServiceを呼び出しストリーミングレスポンスを返す。`customSystemPrompt` と `nodeResults` を受け取る
- `frontend/app/api/apply-workflow/route.ts` — ワークフローセッションAPI。`generate_workflow` ツールがPOSTでデータ保存、`ChatPanel` がGETでデータ取得（ワンタイムトークン方式）
- `frontend/app/api/image-session/route.ts` — 画像セッションAPI。`get_image` ツールがPOSTで画像データ保存、`ChatPanel` がGETで画像取得（ワンタイムトークン方式）
- `frontend/lib/chatService.ts` — Geminiモデルの初期化・`createAgent` によるエージェント作成・ストリーミング実行（`streamEvents` v2）
- `frontend/lib/chatPrompts.ts` — システムプロンプト定義 + `buildImageContext()` で利用可能な画像一覧を動的に付加。`NODE_DESCRIPTIONS` を利用

### スレッド・ストレージ

- `frontend/lib/chatStorageService.ts` — スレッドのlocalStorage永続化（CRUD + タイトル自動生成 + `stripImageData()` で画像base64を除去）
- `frontend/hooks/useChatThreads.ts` — スレッドCRUD・メッセージ管理・アクティブスレッド切替のhook

### ツール

- `frontend/lib/tools/index.ts` — ツールモジュールのバレルエクスポート
- `frontend/lib/tools/registry.ts` — ツールレジストリ（`get_workflow_context`, `get_available_nodes`, `generate_workflow`, `get_image` を登録）+ `createEnabledTools()` ファクトリ
- `frontend/lib/tools/types.ts` — `ToolContext`（nodes, edges, originalImage, nodeResults）, `NodeResultEntry`, `ToolFactory`, `ToolRegistryEntry` 型定義
- `frontend/lib/tools/workflowContextTool.ts` — `get_workflow_context` ツール実装
- `frontend/lib/tools/availableNodesTool.ts` — `get_available_nodes` ツール実装 + `NODE_DESCRIPTIONS` エクスポート
- `frontend/lib/tools/generateWorkflowTool.ts` — `generate_workflow` ツール実装（SimpleWorkflowバリデーション + JSON返却）
- `frontend/lib/tools/getImageTool.ts` — `get_image` ツール実装（画像セッション予約パターン）

## 設計上の特徴

- **Two-hop proxy**: Browser → Next.js → Gemini（APIキーはサーバーサイドのみで管理）
- **ツールレジストリパターン**: 新ツール追加は `TOOL_REGISTRY` にエントリ追加のみで対応可能
- **ストリーミング**: `text/plain` の `ReadableStream`（SSEではない）。中途エラーは同一ストリームにテキスト追加（HTTP 200維持）
- **ツール呼び出しの可視化**: ストリーム内に `<<TOOL_START:name>>` / `<<TOOL_END:name>>` マーカーを挿入し、フロントエンドで解析・表示
- **ワークフロー生成のチャネル分離**: ワークフローデータはチャットストリームではなく、セッションベースの内部API（`/api/apply-workflow`）経由で受け渡し
- **画像取得の再ターンパターン**: `get_image` ツールはセッションベースの予約パターン（`/api/image-session`）で画像を保存し、ストリーム完了後にフロントエンドが画像をユーザーメッセージとして注入して再度AIターンを開始（AIが画像を直接確認可能に）
- **動的システムプロンプト**: `buildImageContext()` により利用可能な画像一覧をシステムプロンプトに動的に付加
- **スレッド永続化**: 全てクライアントサイド（localStorage）。メッセージ追加・スレッド切替時に自動保存。画像base64は保存時に除去
- **カスタムプロンプト**: ユーザーがシステムプロンプトをカスタマイズ可能。localStorageに保存し、API経由でサーバーに送信
- **共有データソース**: `PROCESS_FUNCTIONS_BASE` → `NODE_DESCRIPTIONS` がツールとプロンプトの両方で利用される共通データ
- **コンポーネント分割**: ChatPanelは7つのサブコンポーネントに分割（入力・メッセージ一覧・設定・添付・メッセージ内容・ツール表示・ツール一覧）