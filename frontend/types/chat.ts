/**
 * チャット関連の型定義
 */

/**
 * チャットメッセージに添付される画像情報
 */
export interface ChatMessageImage {
  /** 画像名（識別用） */
  name: string;
  /** base64エンコードされた画像データ */
  base64: string;
  /** MIMEタイプ（例: "image/jpeg", "image/png"） */
  mimeType: string;
}

/**
 * チャットメッセージ  
 */
export interface ChatMessage {
  /** メッセージの送信者ロール */
  role: "user" | "assistant";
  /** メッセージ本文 */
  content: string;
  /** 添付画像（オプション） */
  images?: ChatMessageImage[];
}

/**
 * ワークフロー実行結果の画像情報
 */
export interface WorkflowImage {
  /** 画像ID（"original" または nodeId） */
  id: string;
  /** 表示ラベル（例: "{画像0}", "{画像1}"） */
  label: string;
  /** 画像の説明（例: "元画像", ノード名） */
  description: string;
  /** base64エンコードされた画像データ（data: プレフィックス付き） */
  base64: string;
  /** MIMEタイプ（例: "image/jpeg"） */
  mimeType: string;
}
