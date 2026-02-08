# スナップショット機能（ワークフローの保存・復元）

## 機能概要

- ワークフロー（ノード構造・エッジ・ビューポート・パラメータ）をスナップショットとして保存
- 保存時にランタイムデータ（executionStatus, result, resultParams, icon）を除去
- localStorage に永続化し、最大20件を保持（新しいものが先頭に追加、超過分は切り捨て）
- スナップショットの復元・リネーム・削除が可能
- ページ読み込み時に最新スナップショット（インデックス0）を自動復元（SSRガード付き）
- スナップショットIDは `snapshot-${Date.now()}` で生成（同一ミリ秒の衝突リスクあり）
- 後方互換: `type: 'custom'` → `type: 'processNode'` への正規化を保存・読み込みの両方で適用

## 全体構造

### 保存フロー

- `toFlowSnapshot()` でノード・エッジ・ビューポートをまとめる
- `stripRuntimeNodeData()` でランタイムデータを除去し、永続化に必要なフィールドのみ残す
  - 保持されるフィールド: label, functionName, params
  - 除去されるフィールド: executionStatus, result, resultParams, icon
- `saveFlowSnapshot()` → `storageService`（localStorage）に保存

### 復元フロー

- `loadFlowHistory()` で localStorage から履歴を読み込み
- `isValidSnapshot()` で浅いバリデーション（nodes/edges が配列、viewport がオブジェクト）
- `normalizeSnapshot()` で後方互換の正規化を適用
- flowStore の `setNodes` / `setEdges` / `setViewport` で状態を復元

### UI 操作

- `useSnapshotHistory` hook が CRUD 操作（保存・復元・リネーム・削除）を提供

### 実行履歴（参考）

- `useExecutionHistory` hook がノード状態から完了済み処理を導出
- スナップショットとは独立したインメモリデータ（セッション単位で揮発）

## 設計上の特徴

- **シリアライズとストレージの分離**: flowSerializer（データ整形）と flowPersistence（永続化）が独立
- **正規化マイグレーション**: `normalizeSnapshot()` が保存・読込の両方で古い型名を変換
- **浅いバリデーション**: `isValidSnapshot()` は構造チェックのみ、ノードデータの深い検証はしない
- **実行履歴は非永続**: スナップショットには含まれず、インメモリでセッション単位
- **resultParams と params の分離**: 実行時パラメータ（resultParams）と現在の編集中パラメータ（params）を区別して保持

## 主要な関連ファイル

- frontend/workflow/flowSerializer.ts — FlowSnapshot 型定義 + `stripRuntimeNodeData()` によるランタイムデータ除去
- frontend/workflow/flowPersistence.ts — localStorage 永続化層（保存・読込・削除・履歴管理・バリデーション・正規化）
- frontend/hooks/useSnapshotHistory.ts — スナップショット CRUD hook（保存・復元・リネーム・削除）
- frontend/hooks/useExecutionHistory.ts — 実行履歴導出 hook（処理済みノードから result/resultParams を抽出）
- frontend/lib/storageService.ts — localStorage 抽象化（SSR セーフ + エラーハンドリング）
- frontend/types/workflow.ts — WorkflowFile 型定義
- frontend/app/page.tsx — ページ読み込み時の最新スナップショット自動復元ロジック