---
paths:
  - "frontend/lib/styles/**"
  - "frontend/app/globals.css"
  - "frontend/app/**/*.module.css"
---

# デザインシステム（CSS Foundation）

権威ドキュメント: [frontend/lib/styles/README.md](../../frontend/lib/styles/README.md)

`frontend/lib/styles/` に CSS カスタムプロパティとユーティリティクラスが集約。グローバル `app/globals.css` から `@import '../lib/styles/index.css'` で読み込まれる。

## トークン体系

| ファイル | 提供するトークン |
|---------|-----------------|
| `colors.css` | primary / neutral / success / danger / warning / info のスケール (50–950)、セマンティック色（`--color-background` 等）、キャンバス色、ステータス色。**`prefers-color-scheme` で自動ダークモード切替**。 |
| `spacing.css` | 4px ベース（`--space-1` = 4px … `--space-24` = 96px）+ セマンティック alias（`--space-md`等）+ コンポーネント spacing。 |
| `shadows.css` | `--shadow-xs`–`--shadow-2xl`、色付き影、コンポーネント影（`--shadow-button` 等）。 |
| `z-index.css` | **階層が決まっている**: Base 0–9 / Overlay 10–39 / Fixed UI 40–99 / Popover 100–299 / Modal 300–499 / Toast 500–699 / Critical 700–899。コンポーネント別 alias（`--z-chat-panel` 等）。 |
| `typography.css` | フォントサイズ（`--text-xs`–`--text-5xl`）、ウェイト、line-height、プリセット（`.heading-1`, `.body`, `.label`, `.code` 等）。 |
| `*.module.css` | Buttons / Forms / Animations / Images の CSS Modules。スコープが必要な場合に使用。 |

## ルール

- **ハードコード値禁止** — 色・余白・影・z-index・フォントサイズはすべて変数経由。
- **z-index は階層に従う** — 任意の数値は使わない（`--z-modal` などのトークンを利用）。
- ダークモード対応は変数経由なら自動。`@media (prefers-color-scheme: dark)` で `:root` 変数が再定義される。
