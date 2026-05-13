# Visionfy Demo — 図解ドキュメント（Mermaid）

このディレクトリは、本プロジェクトの構成・技術・データフローを **観点別** に Mermaid で可視化したものです。
1 枚に詰め込まず、関心領域ごとにファイルを分けています。読み始める順番は **01 → 08** がおすすめですが、目的に応じて拾い読みできます。

## ファイル一覧

| # | ファイル | 観点 | こんなときに見る |
|---|---------|------|----------------|
| 01 | [01-system-architecture.md](./01-system-architecture.md) | **全体アーキテクチャ** | プロジェクトに初めて触れる／全体感を掴みたい |
| 02 | [02-tech-stack.md](./02-tech-stack.md) | **技術スタック** | 採用ライブラリ／フレームワークを一覧したい |
| 03 | [03-image-processing-flow.md](./03-image-processing-flow.md) | **画像処理のデータフロー** | `process-node` の流れを追いたい／新関数を足したい |
| 04 | [04-ai-chat-flow.md](./04-ai-chat-flow.md) | **AI チャットのストリーミング** | ツール呼び出し／セッション受け渡しを理解したい |
| 05 | [05-frontend-structure.md](./05-frontend-structure.md) | **フロント構成** | コンポーネント／コンテキストの依存関係を知りたい |
| 06 | [06-backend-structure.md](./06-backend-structure.md) | **バックエンド構成** | Flask 側のディレクトリ・共通基盤を見たい |
| 07 | [07-workflow-data-model.md](./07-workflow-data-model.md) | **ワークフローのデータモデル** | SimpleWorkflow / FlowSnapshot の違いを把握したい |
| 08 | [08-infrastructure-deployment.md](./08-infrastructure-deployment.md) | **インフラとデプロイ** | GCP リソース／Terraform の構造を知りたい |

## 読み方

- Mermaid は GitHub・VS Code（Markdown Preview Mermaid Support 拡張）でそのままレンダリングされます。
- 図の **後** に箇条書きで補足説明を入れているので、図 → 説明の順に読むと理解が早いです。
- 図中の角丸長方形は **コンポーネント／サービス**、シリンダは **ストレージ**、点線矢印は **非同期／ストリーム**、実線矢印は **同期呼び出し** を表します。
- 各図は権威ドキュメント（`docs/features/*.md` や `.claude/rules/*.md`）の要約です。詳細仕様はリンク先を参照してください。

## 関連ドキュメント

- [.claude/rules/architecture.md](../../.claude/rules/architecture.md) — プロジェクト全体像（テキスト版）
- [docs/features/](../features/) — 機能別の権威ドキュメント
- [docs/features/ENVIRONMENT.md](../features/ENVIRONMENT.md) — 環境変数マトリクス
- [terraform/README.md](../../terraform/README.md) — インフラ運用ガイド
