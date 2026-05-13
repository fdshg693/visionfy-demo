---
paths:
  - "frontend/**"
---

# Frontend — 非自明な内部仕様

`.cursor/rules/frontened.mdc` および機能ドキュメントから抽出した、コードを読んだだけでは気付きにくい挙動。

## SSR / Hydration

- `app/page.tsx` は `isHydrated` が `true` になるまで `null` を返す（`useEffect` で flip）。サーバーには `window` がなく `loadFlowHistory()` が `[]` を返すため、これをやらないとハイドレーションが mismatch する。
- `initialHistoryEntries` は lazy `useState` イニシャライザで localStorage を **1回だけ同期読み**。`latestSnapshot = initialHistoryEntries[0]`（履歴は常に新しいものが先頭）。

## コンテキスト・状態管理

- `FlowStoreContext` の value は `useMemo` でラップされているが、ノード data の任意のフィールド（`executionStatus` など）変更で新しい value object になり、全消費コンポーネントが再レンダリングされる。
- `InspectorContext` は読み取り/実行専用で、prop drilling 回避のためだけに存在。`FlowStoreContext` の `nodes` を再公開している。

## API プロキシ層

- `BackendApiService` は **サーバー側でも実行される**ため、`base64ToBlob` / `blobToBase64` が Node.js (`Buffer`) と Browser (`atob`/`FileReader`) の両経路を持つ。
- レスポンス正規化は 2 パターンを処理: (1) 直接バイナリ画像、(2) `{ ok: true, data: { url } }` JSON（2回目の fetch で画像取得）。
- **GaussianBlur**: `ksizeX`/`ksizeY`/`sigmaX`/`sigmaY` を別フィールドで送る。**偶数 ksize はバックエンド側で +1 される**（フロントは生値を送る）。
- **Grayscale**: `enableThreshold=false` なら `threshold` を FormData に含めない（Flask 側で "閾値なし" として扱われる）。

## 実行・トラバーサル

- 接続制約で 1 入力 1 出力の線形のみ。`Set` で visited 管理しているがそもそもループ不可。
- End ノードが未接続で末端の Process ノードに out-edge が無い場合、トラバーサルは静かに終了し最後の結果を返す（エラーにならない）。
- 失敗ノード ID は `ProcessingError.nodeId` 優先、なければ `currentNodeId`（= Start ノード ID から再代入されない）にフォールバック。`ValidationError` は `nodeId` を持たないので後者経路。

## React Flow の罠

- `fitView` が有効なため、スナップショット復元時の `viewport` 位置/ズームは初回マウントで上書きされる。
- ノード削除時、React Flow は接続エッジを自動削除しない。`FlowCanvas` が手動でフィルタリングする。

## 永続化されないもの

シリアライザは process ノードについて `label` / `functionName` / `params` のみ取り、`executionStatus` / `result` / `resultParams` / `icon` は除去。`resultParams` と `params` は別フィールド（実行履歴表示で `resultParams ?? params` を使い、未再実行時に古い実行時パラメタを保持）。

## メモリ

- 実行結果（`result`）は **base64 フル画像をノード state に保持**。大画像は FlowStore context value とスナップショット双方を膨らませる。
- "Before" 画像の Blob URL は `ResultInspector` の `useEffect`（key: `files`）で生成し、cleanup で `URL.revokeObjectURL` する。

## エラー分類

- `categorizeError()` は文字列キーワードで分類。"failed" は ProcessingError に分類されるが極めて広いため、関係ない例外も誤分類されがち。
- `createErrorFromStatus()` は **5xx を `NetworkError`** にマップ（処理エラーではなく接続性問題扱い）。
- `AppError` サブクラスは `Object.setPrototypeOf(this, X.prototype)` を呼ぶ（ES5 トランスパイル下で `instanceof` を正しく動かすため）。

## その他

- 新規ノード追加時のデフォルト関数 `createclahe` は `constants/flowConfig.ts` の `handleAddNode` でハードコード。
- `import type` でチャットの型を取ることで、`chatService.ts` 経由の LangChain 依存がクライアントバンドルに混入しないようにしている。
