# LangChain Tools Integration

このディレクトリはVisionfyのAIチャット機能で使用されるLangChainツールを管理します。

## アーキテクチャ

### ツールベースのコンテキスト取得

以前は`workflowContext`を文字列としてシステムプロンプトに直接埋め込んでいましたが、現在はAIがツールを使用して動的にコンテキストを取得するアーキテクチャに変更されています。

**メリット:**

- AIが必要なときにのみコンテキストを取得（効率的）
- システムプロンプトのサイズが削減
- 複数のツールを柔軟に追加可能
- ツールごとに有効/無効を動的に制御可能

### ファイル構造

```
lib/tools/
├── index.ts                    # エクスポート用のエントリーポイント
├── types.ts                    # ツール関連の型定義
├── registry.ts                 # ツールレジストリと管理機能
└── workflowContextTool.ts      # ワークフローコンテキスト取得ツール
```

## ツールの追加方法

### 1. ツールの実装

新しいツールを追加するには、以下のステップに従います：

```typescript
// lib/tools/myNewTool.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolFactory } from "./types";

export const createMyNewTool: ToolFactory = (context) => {
  return new DynamicStructuredTool({
    name: "my_new_tool",
    description: "このツールの目的と使い方を説明",
    schema: z.object({
      // 必要に応じて引数を定義
      param1: z.string().describe("パラメータの説明"),
    }),
    func: async ({ param1 }) => {
      // ツールのロジックを実装
      return "結果を返す";
    },
  });
};

// オプション: ツールが有効かどうかを判定
export const isMyNewToolEnabled = (context: ToolContext) => {
  return /* 条件を返す */;
};
```

### 2. レジストリへの登録

作成したツールを `registry.ts` に登録します：

```typescript
import { createMyNewTool, isMyNewToolEnabled } from "./myNewTool";

export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  // 既存のツール...
  {
    name: "my_new_tool",
    description: "ツールの簡潔な説明",
    factory: createMyNewTool,
    isEnabled: isMyNewToolEnabled, // オプション
  },
];
```

### 3. エクスポートの追加

`index.ts` にエクスポートを追加します：

```typescript
export { createMyNewTool, isMyNewToolEnabled } from "./myNewTool";
```

これだけです！ツールは自動的にAIに提供されます。

## 既存のツール

### get_workflow_context

ワークフローの現在の状態（ノード構成、パラメータ、パイプライン構造）を取得します。

**有効条件:** `nodes`と`edges`が`ToolContext`に存在する場合

**使用例:**

```
ユーザー: 現在のワークフローを教えて
AI: [get_workflow_context ツールを実行]
AI: 現在のワークフローは Start → CLAHE → End の構成です...
```

## ToolContext

`ToolContext`はツールがアクセスできるデータを定義します。現在は以下のフィールドがあります：

```typescript
interface ToolContext {
  nodes?: string; // JSONシリアライズされたノード配列
  edges?: string; // JSONシリアライズされたエッジ配列
}
```

新しいコンテキストデータが必要な場合は、`types.ts`で`ToolContext`を拡張してください。

## 使用フロー

1. **ChatPanel** がユーザーのメッセージと共に`nodes`と`edges`を送信
2. **chat API route** が`ToolContext`を構築（JSON文字列化）
3. **ChatService** が有効なツールを生成してモデルにバインド
4. **AIモデル** が必要に応じてツールを呼び出す
5. ツールが結果を返し、AIがそれを使って回答を生成

## 拡張のアイデア

将来的に追加できるツールの例：

- **search_documentation**: アプリケーションのドキュメントを検索
- **analyze_image**: 画像の内容を分析（ビジョンAPI使用）
- **get_processing_history**: 過去の処理履歴を取得
- **suggest_parameters**: 画像に最適なパラメータを提案
- **export_workflow**: ワークフローをファイルにエクスポート

## 参考資料

- [LangChain Tools Documentation](https://docs.langchain.com/oss/javascript/langchain/tools)
- [Structured Tool API](https://js.langchain.com/docs/how_to/custom_tools)
