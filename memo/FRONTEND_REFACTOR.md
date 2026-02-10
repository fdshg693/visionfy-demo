# フロントエンドリファクタリング項目

## 1. コンポーネント構造

### 重複ロジックの統合
- SnapshotPanelとSnapshotDropdownのスナップショットリスト描画ロジック統合（SnapshotListItemコンポーネント抽出）
- 複数箇所のBefore/After画像比較レイアウト統合（ImageComparisonコンポーネント作成）
- ProcessNodePopup、ChatPanel、ThreadMenuなどのモーダル/ドロップダウンパターン統合（Modalコンポーネント作成）
- dropdown outside-clickパターンを3箇所で重複実装（useOutsideClickDropdownフック作成）

### 大規模コンポーネントの分割
- ChatPanel（387行）を4つのサブコンポーネントに分割
  - ChatInputArea（テキストエリア、ファイル入力、プレビュー）
  - ChatSettingsPanel（カスタムプロンプトUI）
  - ChatMessageList（メッセージレンダリング、スクロール）
  - FileAttachmentManager（ファイル選択、base64変換）
- ProcessNodeParamInputsのPARAM_FIELD_RENDERERSを個別コンポーネントに分割（SelectParamField、TupleParamField等）
- ResultNodeInspectorをタブ別コンポーネントに分割（ResultComparisonTab、ExecutionHistoryTab）
- ProcessNodeをヘッダー・ボディ・ホバーポップアップに分割

### 不要なラッパー削除
- InspectorPanel（10行、ロジックなし）を削除し、直接子コンポーネントをpage.tsxで配置

### 共通UIコンポーネント作成
- Buttonコンポーネントライブラリ（primary、secondary、danger、iconバリアント）
- ImageHoverPopup/ImagePreviewTooltipコンポーネント
- IconButtonコンポーネント（7箇所以上で使用）
- Dropdownコンポーネント（4箇所以上で使用）
- ImageBoxコンポーネント（5箇所以上で使用）
- FormFieldコンポーネント（8箇所以上で使用）
- TabGroupコンポーネント（3箇所以上で使用）

### その他
- アイコン/ラベルマッピングをconstants/iconMap.tsに集約
- NodeContainerラッパーコンポーネントで一貫したnode構造を提供

## 2. 型定義とバリデーション

### 型安全性の向上
- BaseProcessNodeDataのRecord<string, unknown>継承を削除し、正確なプロパティ定義のみにする
- resultParamsをRecord<string, unknown>から適切に型付けされたResultMetadata型に変更
- ExecutionResult型を統一（nodeId、functionName、params、resultImage、timestampを含む）
- 全レイヤーでProcessNodeFunctionName型を一貫して使用（string | undefinedへのキャスト排除）
- OpencvParamValueの配列型をreadonly [number, number]に制限

### 型ガードの強化
- 数値範囲検証（threshold 0-255、gamma > 0等）をtype guardに追加
- 配列要素型チェック（tuple長、要素型）をtype guardに追加
- isNodeResultEntry()型ガード追加
- 関数名配列を定数化してtype guardで再利用

### 型アサーションの整理
- as unknown as Type、as any等の不安全なキャストを型ガードベースに置き換え
- useProcessNodeParams、flowStore、chatPrompts等で散在する型アサーションを統一パターンに
- union型narrowingヘルパー関数作成（extractNodeFunctionName、extractNodeParams）

### 型定義の整理統合
- workflow.ts（3行のみ）にflowSerializer.ts、flowStore.tsx、tools/types.ts等の型定義を集約
- BaseProcessNodeData拡張問題の解決（動的プロパティ追加を防ぐ）

## 3. Hooksのパフォーマンスと最適化

### 依存関係の最適化
- useWorkflowExecutionの8項目依存配列を分割・最適化（executeWorkflow、executeProcessNode等のメモ化）
- useContextMenuのescapeキーリスナーeffectから不要な依存を削除
- useExecutionHistoryのuseMemoをnodes全体でなくprocessノードのみに限定
- useProcessNodeParamsの二重memoを単一memoに統合
- useWorkflowContextの三重memo入れ子を二段階に削減

### state更新パターンの改善
- useChatThreadsのネストsetState反パターンを平坦化
- useChatThreadsのlocalStorage連続読み込みをバッチ化（saveCurrentThread、selectThread等で重複削除）
- useSnapshotHistoryのスナップショット保存前に変更検出・重複排除追加

### メモリリーク・競合状態の修正
- useResizablePanelのイベントハンドラーメモリリーク修正（handleMouseDown内のクロージャ処理）
- useObjectURLのblob URLキャッシング追加（同一Fileオブジェクトの再利用）

### 共通ロジック抽出
- fileToBase64変換ロジック（useWorkflowExecutionとChatPanelで重複）をlib/fileUtils.tsに抽出
- useChatThreadsとuseSnapshotHistoryのCRUDパターンをuseStorageEntityListフックに抽出
- useChatStreamingフック作成（ChatPanelのfetch + streamingロジック分離）
- useToolMarkerParserフック作成（MessageContentのツールマーカー解析分離）

## 4. API呼び出しとエラーハンドリング

### エラーハンドリング統一
- errors.ts、useWorkflowExecution.ts、ChatPanel.tsx、ErrorBoundary.tsx等4箇所以上のエラー分類ロジックを統一
- API routeのエラーレスポンス形式統一（process-node/route.tsとchat/route.tsで異なる形式を統一）
- チャットエラーをメッセージスレッドに追加せずtoastで表示
- エラー境界を欠くlayout.tsxにErrorBoundary追加
- 個別コンポーネント（ChatPanel、FlowCanvas、InspectorPanel）にエラー境界追加

### APIレスポンス処理統一
- BackendApiService、ChatPanel等の複数のレスポンス正規化パターンを統一
- レスポンス型定義追加（TypeScript interface + 実行時バリデーション）
- エラー詳細伝播契約を確立（API routeとフロントエンド間）
- InspectorContextのcontext利用可能性チェックとfallback provider追加

### 入力検証の集約
- process-node/route.ts、backendApiService.ts、useWorkflowExecution.ts等に散在するパラメータ検証を統一
- スキーマベースバリデーター作成（Zod/Valibot等）
- backendApiAdaptersのFormData構築ロジック共通化とパラメータ型検証追加

### Base64処理統一
- BackendApiServiceのbase64ToBlob/blobToBase64とuseWorkflowExecutionのfileToBase64を統一ユーティリティに集約
- JSON経由のbase64送信をFormData直接ストリームに変更（メモリ効率化）

### その他
- toast表示時間統一（ToastContext.tsx、Toast.tsx間の不整合解消）
- ノードステータス更新の一貫性確保（エラー時のステータスクリア機構追加）
- エラーリトライUI追加
- logger使用統一（console.error直接呼び出しをcreateLogger()に置き換え）
- サイレントエラーキャッチの削除（全キャッチブロックでログ出力）

## 5. State管理

### Context構造の再編
- FlowStoreContextを粒度の細かいコンテキストに分割（NodesContext、EdgesContext、ViewportContext）またはZustand/Jotai移行
- InspectorContextからnodesプロパティ削除（ResultNodeInspectorが直接FlowStoreから読み取る）
- InspectorContextをInputContext（アップロード）とExecutionContext（実行トリガー）に分割
- ExecutionStateContext作成（isProcessing、currentNodeId、currentError、results、historyを一元管理）
- ToastContextにエラー重複排除機能追加（エラーフィンガープリント）

### 状態の重複排除
- スナップショット履歴からランタイムデータ（result、resultParams）削除（永続化設定と一時的実行結果の分離）
- filesステート管理をInspectorContextとuseWorkflowExecution間で統合
- ExecutionHistoryをresult hashベースのメモ化に変更（全nodes配列依存回避）

### 実行状態の一元化
- useWorkflowExecution、FlowStore、useSnapshotHistoryに分散した実行状態を単一ExecutionStateContextに集約
- flowPersistenceロジックをuseSnapshotManagerフックに抽出

### その他
- Provider階層順序のドキュメント化（ErrorBoundary → ToastProvider → FlowStoreProvider → InspectorProvider → WorkflowContent）
- InspectorContext型をread/execute-onlyに整理
- useCallbackラッパーで実行コールバックを安定化（FlowStore消費コンポーネントの再レンダー防止）
- Context value再作成防止（executeWorkflow等のコールバック変更時のメモ化）

## 6. UI一貫性とスタイリング

### CSS変数・定数化
- 40箇所以上のハードコードされた色値をCSS custom propertiesに統一（--color-border、--color-text-primary等）
- spacing値（gap: 8px等100箇所以上）をスケール化（--space-1〜--space-10）
- z-index階層整理（--z-dropdown: 50、--z-modal: 100等）
- box-shadow値統一（--shadow-sm、--shadow-md、--shadow-lg、--shadow-xl）
- typography scaleの定義（.text-xs、.text-sm、.text-base等）

### スタイル重複の削減
- 8箇所以上のボタンバリアントをlib/styles/buttons.module.cssに統一（.btn-primary、.btn-secondary、.btn-danger、.btn-icon等）
- 5箇所以上のフォーム入力スタイルをlib/styles/forms.module.cssに統一（.input-field、.input-select、.input-textarea等）
- 5箇所以上の画像コンテナをlib/styles/images.module.cssに統一（.image-box、.image-box--square、.image-box--thumbnail等）
- 4箇所のドロップダウン/ポップアップ構造を統一（.dropdown-container、.dropdown-header、.dropdown-item等）
- 7箇所以上のアイコンボタンパターンを統一（.icon-button-sm、.icon-button-md、.icon-button-lg）

### アニメーションの整理
- ProcessNode.module.css、ProcessNodePopup.module.cssに散在するkeyframesをanimations.module.cssに集約

### 推奨アプローチ
- フェーズ1: CSS基盤（colors.module.css、spacing.module.css、animations.module.css、buttons.module.css、forms.module.css作成）
- フェーズ2: 共通コンポーネント抽出（IconButton、Dropdown、ImageBox、FormField、Badge）
- フェーズ3: 全コンポーネントでの共通スタイル適用、z-index一貫性確認、レスポンシブ検証
