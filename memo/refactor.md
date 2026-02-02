---

Frontend リファクタリング提案

優先度: 高

---

優先度: 中

4. マジック文字列の定数化

場所: 各所に散在

// 現状  
 executionStatus: 'idle' | 'running' | 'success' | 'error'

// 提案: 定数オブジェクト化  
 export const EXECUTION_STATUS = {  
 IDLE: 'idle',  
 RUNNING: 'running',  
 SUCCESS: 'success',  
 ERROR: 'error',  
 } as const;

5. バリデーションの追加

場所: types/opencv.ts, ProcessNodeParamInputs.tsx

パラメータの範囲チェックがない（例: threshold 0-255、ksize は奇数のみ）。

提案: OpencvParamDefinition に validation ルールを追加  
 interface OpencvParamDefinition {  
 // 既存フィールド...  
 validation?: {  
 min?: number;  
 max?: number;  
 isOdd?: boolean;  
 };  
 }

6. 循環参照検出の改善

場所: useWorkflowExecution.ts:113-115

現状の visited Set は不完全。ノード追加後にループ検出される。

提案: 実行前にトポロジカルソートでDAG検証

---

優先度: 低

7. コンポーネント分割

- page.tsx (215行) → スナップショット操作を別hookに
- ProcessNodeInspector.tsx → フォーム部分を分離

8. 未使用コードの削除

- types/opencv.ts の CV2_COLOR_RGB2GRAY 定数（未使用）

9. 命名の統一

- バックエンドの createclane タイポを修正するか、フロントエンドで明示的にマッピング

---

ファイル構成サマリー（追加したコメント）  
 ┌───────────────────────────────┬───────────────────────────────────────┐  
 │ ファイル │ 役割 │  
 ├───────────────────────────────┼───────────────────────────────────────┤  
 │ hooks/useWorkflowExecution.ts │ ノードグラフ走査・API実行 │  
 ├───────────────────────────────┼───────────────────────────────────────┤  
 │ workflow/flowStore.tsx │ ノード/エッジ/実行状態の一元管理 │  
 ├───────────────────────────────┼───────────────────────────────────────┤  
 │ lib/backendApiService.ts │ Flaskバックエンドへのリクエスト抽象化 │  
 ├───────────────────────────────┼───────────────────────────────────────┤  
 │ lib/backendApiAdapters.ts │ エンドポイント別リクエスト形式変換 │  
 └───────────────────────────────┴───────────────────────────────────────┘
