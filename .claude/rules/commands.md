---
paths:
  - "**"
---

# 開発コマンド

プロジェクトルート [justfile](../../justfile) のレシピが推奨（Terraform は環境別 tfvars/state の指定が必要なため特に）。

## 最低限の起動

| 目的 | コマンド | cwd |
|------|---------|-----|
| Frontend dev (localhost:3000) | `pnpm dev` | `frontend/` |
| Frontend lint/build | `pnpm lint` / `pnpm build` | `frontend/` |
| Backend dev (localhost:8080) | `python src/main.py` | `backend/` |
| Backend deps | `pip install -r requirements.txt` | `backend/` |

## Terraform（環境別 dev/prod）

`just tf-init` → `just tf-bootstrap <env>` → `just docker-release-all <repo> <tag>` → `just tf-plan <env>` → `just tf-apply <env>`。生の `terraform` を叩く場合は **必ず** `-var-file=environments/<env>.tfvars` と `-state=states/<env>.tfstate` を両方指定する。詳細: [terraform/README.md](../../terraform/README.md),

## シェル

Windows 環境を前提に PowerShell 構文。`/dev/null` ではなく `$null`、`$env:VAR` を使う。
