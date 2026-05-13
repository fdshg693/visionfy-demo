# 08. インフラとデプロイ

GCP 上に Terraform でプロビジョニング。**Cloud Run × 2** が中心で、Artifact Registry / Secret Manager / Cloud Storage がそれを支える。
**Docker イメージのビルド／プッシュは `terraform apply` の前** に手動で行う必要がある（Cloud Run が参照するため）。

## GCP リソース構成図

```mermaid
flowchart TB
    subgraph Internet["🌐"]
        Users[ユーザー]
        Gemini[Gemini API]
    end

    subgraph Project["GCP Project (asia-northeast1)"]
        direction TB

        subgraph CR["Cloud Run"]
            FE["visionfy-frontend<br/>1 CPU / 512Mi<br/>scale 0–5<br/>port 3000"]
            BE["visionfy-backend<br/>2 CPU / 4Gi<br/>scale 0–3<br/>port 8080"]
        end

        subgraph SA["IAM Service Accounts"]
            FESA[frontend SA<br/>roles/secretmanager.<br/>secretAccessor]
            BESA[backend SA<br/>roles/storage.<br/>objectViewer]
        end

        subgraph Reg["Artifact Registry"]
            AR[(visionfy-demo<br/>Docker repo)]
        end

        subgraph Secrets["Secret Manager"]
            SK[(GEMINI_API_KEY)]
        end

        subgraph Stor["Cloud Storage"]
            MB[(models bucket<br/>model.ckpt)]
        end
    end

    Users -->|HTTPS| FE
    FE -->|API_BASE_URL<br/>動的注入| BE
    FE -.->|stream| Users
    FE -.->|LangChain Agent| Gemini

    FE -. uses .-> FESA
    BE -. uses .-> BESA
    FESA -. read .-> SK
    BESA -. read .-> MB

    FE -. image pull .-> AR
    BE -. image pull .-> AR

    classDef svc fill:#e3f2fd,stroke:#1976d2
    classDef sa fill:#e8f5e9,stroke:#388e3c
    classDef store fill:#fff8e1,stroke:#f9a825
    class FE,BE svc
    class FESA,BESA sa
    class AR,SK,MB store
```

## Terraform ファイル構成

```mermaid
graph LR
    subgraph TF[terraform/]
        Main[main.tf<br/>プロジェクト / APIs]
        Vars[variables.tf<br/>入力定義]
        Out[outputs.tf]
        AR[artifact_registry.tf]
        Sec[secrets.tf]
        Stor[storage.tf]
        IAM[iam.tf]
        CR[cloudrun.tf<br/>★ env 真実の源]
    end

    subgraph EnvSwitch[環境差分 .gitignore]
        TfvarsDev[(environments/dev.tfvars)]
        TfvarsProd[(environments/prod.tfvars)]
        StateDev[(states/dev.tfstate)]
        StateProd[(states/prod.tfstate)]
    end

    TfvarsDev -.-> Vars
    TfvarsProd -.-> Vars
    Vars --> AR
    Vars --> Sec
    Vars --> Stor
    Vars --> CR
    Main --> AR
    Main --> Sec
    Main --> Stor
    Main --> IAM
    Main --> CR
    CR -. state 書き込み .-> StateDev
    CR -. state 書き込み .-> StateProd
```

## デプロイフロー

```mermaid
sequenceDiagram
    participant Dev as 開発者
    participant Just as just (justfile)
    participant Docker
    participant ARreg as Artifact Registry
    participant TF as Terraform
    participant CR as Cloud Run

    Dev->>Just: just tf-init
    Just->>TF: terraform init
    Dev->>Just: just tf-bootstrap dev
    Just->>TF: 最低限のリソース作成<br/>(プロジェクト / AR repo)

    Dev->>Just: just docker-release-all <repo> <tag>
    Just->>Docker: build frontend & backend
    Docker->>ARreg: push images

    Dev->>Just: just tf-plan dev
    Just->>TF: terraform plan<br/>-var-file=environments/dev.tfvars<br/>-state=states/dev.tfstate

    Dev->>Just: just tf-apply dev
    Just->>TF: terraform apply
    TF->>CR: Cloud Run リビジョン作成<br/>(env を動的注入)
    CR-->>Dev: サービス URL
```

## 補足

### 環境分離の仕組み
- dev / prod は **同一の `.tf` ファイル群** を共有し、以下のみで切り替え:
  - 変数値: `terraform/environments/<env>.tfvars`（`-var-file` で指定）
  - state: `terraform/states/<env>.tfstate`（`-state` で指定）
- `environments/*.tfvars` と `states/*.tfstate` は **`.gitignore` 対象**。`*.tfvars.example` を見れば dev/prod の差分が一目でわかる。
- 生 `terraform` を叩く場合は **必ず `-var-file` と `-state` を両方指定**。忘れると別環境を破壊するリスクがあるので `just` 経由が推奨。

### Cloud Run 個別仕様
- **`visionfy-frontend`** (port 3000): Secret Manager から `GEMINI_API_KEY` を取得。`API_BASE_URL` がバックエンドの URL に **動的注入** される（`google_cloud_run_v2_service.backend.uri`）。
- **`visionfy-backend`** (port 8080): 初回推論時に GCS から `model.ckpt` を **遅延ロード**（最大 100 秒の `/health` スタートアッププローブで吸収、`failure_threshold = 6 × period 15s`）。
- 両サービスとも `allUsers` 公開（パブリック）。`min_instance_count = 0` でコールドスタート許容。

### Docker 詳細
| イメージ | ベース | ステージ | 備考 |
|---------|------|--------|------|
| frontend | `node:22-alpine` | deps → builder → runner | Next.js standalone 出力、非 root |
| backend | `python:3.12-slim` | deps → runtime | `libglib2.0-0` / `libgl1` / `libxcb1` が必須（OpenCV 用） |

backend は `--workers 1 --threads 8 --timeout 0` で起動 → OpenCV は CPU バウンドだが GIL フレンドリーなのでこの設定が効率的。timeout は Cloud Run 側に任せる。

### 環境変数の真実の源
- **Cloud Run の env**: [`terraform/cloudrun.tf`](../../terraform/cloudrun.tf) が SoT。
- **ローカル**: 各サービスの `.env.example` を `.env` にコピー（[`backend/.env.example`](../../backend/.env.example) / [`frontend/.env.example`](../../frontend/.env.example)）。
- **横断マトリクス**: [docs/features/ENVIRONMENT.md](../features/ENVIRONMENT.md) に local / cloud / both のスコープが整理されている。

### よく使うコマンド
| コマンド | 説明 |
|---------|------|
| `just tf-init` | Terraform 初期化 |
| `just tf-bootstrap <env>` | プロジェクト / AR repo のみ先行作成 |
| `just docker-release-all <repo> <tag>` | 両イメージビルド & push |
| `just tf-plan <env>` | dry-run（環境別 tfvars/state を自動指定） |
| `just tf-apply <env>` | 本番適用 |

詳細: [terraform/README.md](../../terraform/README.md), [.claude/rules/infrastructure.md](../../.claude/rules/infrastructure.md), [.claude/rules/commands.md](../../.claude/rules/commands.md)
