
# Visionfy Demo

このリポジトリは、Visionfy Demo アプリケーションのソースコードを含んでいます。

## 📂 プロジェクト構成

```text
.
├── backend/      # Python Flask API（Cloud Run 上でホスト）
│   ├── src/      # アプリケーションソースコード
│   └── test/     # テストスクリプト
└── frontend/     # Next.js フロントエンド（Firebase App Hosting 上でホスト）
```

## 🔗 アーキテクチャと関係

```text
+----------------------+           +----------------------+
|   Frontend (Next.js) |   HTTPS   |   Backend (Flask)    |
| [Firebase Hosting]   +---------->+ [Cloud Run]          |
|                      |           |                      |
+----------------------+           +----------------------+
```

## 🚀 デプロイ概要

### フロントエンド

- プラットフォーム: Firebase App Hosting
- 設定ファイル: `frontend\apphosting.yaml`
- 方法:
  - 自動: 変更が `main` にプッシュされると自動的にデプロイされます。
  - 手動: `firebase deploy` を使用してください。

### バックエンド

- プラットフォーム: Google Cloud Run
- 方法: `gcloud` CLI を使った手動デプロイ。
- Github Actions による自動デプロイも設定されています。`.github\workflows\backend-cloud-run.yml` を参照してください。

**詳細は`infra`ディレクトリ内のドキュメントを参照してください。**