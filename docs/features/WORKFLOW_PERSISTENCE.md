# ワークフロー永続化

## 概要

Visionfy Demoは、ワークフローを保存・復元するために2つの形式をサポートしています。

## 2つの保存形式

### 📝 簡易形式（SimpleWorkflow） - ユーザー編集推奨

**用途**: AIチャット経由のワークフロー生成、JSONインポート、手動編集

**特徴**:
- 最小限の情報（`functionName` + `params`）のみ
- ノード位置、エッジ、viewportは自動計算
- 人間が読み書きしやすい

**構造**:
```typescript
{
  "processNodes": [
    {
      "functionName": "createclahe",
      "params": { "clipLimit": 40 }
    },
    {
      "functionName": "grayscale"
      // params省略時はデフォルト値を使用
    }
  ]
}
```

**自動補完される項目**:
- ノード位置（水平方向に150px間隔、y=150固定）
- START/ENDノードの自動生成
- エッジの自動接続（線形パイプライン）
- デフォルトviewport（zoom: 1, x: 0, y: 0）

---

### 💾 完全形式（FlowSnapshot） - 内部ストレージ形式

**用途**: localStorage保存、スナップショット履歴、完全な状態復元

**特徴**:
- `nodes`, `edges`, `viewport` を含む完全な状態
- ランタイムデータ（`executionStatus`, `result`, `resultParams`, `icon`）は除外
- React Flowの状態を1:1で保存

**構造**:
```typescript
{
  "nodes": [
    { "id": "start", "type": "startNode", "position": {...}, "data": {...} },
    { "id": "node-1", "type": "processNode", "position": {...}, "data": {...} },
    { "id": "end", "type": "endNode", "position": {...}, "data": {...} }
  ],
  "edges": [
    { "id": "xy-edge__start-node-1", "source": "start", "target": "node-1", ... }
  ],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

**除外されるランタイムデータ**:
- `executionStatus` - ノードの実行状態（pending/running/success/error）
- `result` - 実行結果の画像（base64）
- `resultParams` - 実行時に使用されたパラメータ
- `icon` - ノードのアイコン名

---

## アーキテクチャ

### データフロー

```
┌─────────────────┐
│ SimpleWorkflow  │ (JSON Import, AI Chat)
│ (簡易形式)       │
└────────┬────────┘
         │ convertSimpleWorkflowToSnapshot()
         ↓
┌─────────────────┐
│  FlowSnapshot   │ (React Flow State)
│  (完全形式)      │
└────────┬────────┘
         │ stripRuntimeNodeData()
         ↓
┌─────────────────┐
│ Stripped        │
│ FlowSnapshot    │ (永続化用)
└────────┬────────┘
         │ saveFlowSnapshot()
         ↓
┌─────────────────┐
│  localStorage   │
│  (履歴最大20件) │
└─────────────────┘
```

### モジュール構成

```
types/
├── simpleWorkflow.ts          # SimpleWorkflow型定義
├── workflowPersistence.ts     # 永続化関連型の集約
└── node.ts                    # ProcessNodeData型

workflow/
├── workflowConverter.ts       # 形式変換ロジック集約
├── workflowValidator.ts       # 検証ロジック集約
├── flowPersistence.ts         # localStorage操作
└── flowStore.tsx              # React Context

hooks/
├── useWorkflowImport.ts       # インポートロジック
└── useSnapshotHistory.ts      # 履歴CRUD
```

---

## 使用例

### 簡易形式でワークフローを定義

```json
{
  "processNodes": [
    {
      "functionName": "restore_brightness",
      "params": { "value": 30 }
    },
    {
      "functionName": "createclahe",
      "params": {
        "clipLimit": 50,
        "tileGridSize": [8, 8]
      }
    },
    {
      "functionName": "gaussian_blur"
    }
  ]
}
```

## 後方互換性

### 型名の正規化

古いバージョンで使用されていた `type: 'custom'` は自動的に `type: 'processNode'` に変換されます。

```typescript
import { normalizeSnapshot } from '@/workflow/workflowConverter';

const normalized = normalizeSnapshot(oldSnapshot);
// → custom → processNode に自動変換
```

---

## 制限事項

- スナップショット履歴は最大20件（古いものから自動削除）
- スナップショットIDは `snapshot-${Date.now()}` 形式（同一ミリ秒での衝突リスクあり）
- 実行履歴（result, resultParams）はスナップショットに含まれない（セッション単位で揮発）

---

## 関連ドキュメント

- [スナップショット機能](./SNAPSHOT.md) - 履歴保存・復元のUI操作
- [Architecture](../../ai/overview/architecture.md) - システム全体のアーキテクチャ
