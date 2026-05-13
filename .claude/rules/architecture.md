---
paths:
  - "**"
---

# Visionfy Demo — プロジェクト全体像

ノードベース画像処理ワークフローアプリ。Start → Process(複数) → End の線形パイプラインを React Flow で組み立て、Flask バックエンドで OpenCV / Patchcore による変換を適用する。Gemini チャットアシスタント付き。

## 構成

| 領域 | パス | 役割 |
|------|------|------|
| Frontend | `frontend/` | Next.js 16 + React 19 + TypeScript + Tailwind 4 + React Flow |
| Backend  | `backend/`  | Flask + OpenCV (headless) + anomalib Patchcore + Gunicorn |
| Infra    | `terraform/`| GCP (Cloud Run x2, Artifact Registry, Secret Manager, Cloud Storage) |
| Docs     | `docs/features/`, `ai/overview/` | 機能別ドキュメントとAI向け概要 |

## データフロー

1. **画像処理**: Browser → `POST /api/process-node` (Next.js) → `BackendApiService` + adapter → Flask `/api/<func>` → JPEG返却。
2. **AIチャット**: Browser → `POST /api/chat` (Next.js, streaming) → `ChatService` → LangChain Agent + Gemini 2.5 Pro → ストリームでツール呼び出しを挿入。

## トピック別ルール

| 関心領域 | 該当ルール |
|---------|-----------|
| 画面・キャンバス・ノード | [[workflow-canvas]] |
| ワークフロー保存/エクスポート | [[workflow-persistence]] |
| AIチャット・ツール | [[ai-chat]] |
| 画像処理関数の追加 | [[backend-api]] |
| ロギング | [[logging]] |
| デザインシステム（CSS） | [[design-system]] |
| インフラ・デプロイ | [[infrastructure]] |
| フロント側の非自明な振る舞い | [[frontend-internals]] |
| バックエンドの非自明な振る舞い | [[backend-internals]] |
