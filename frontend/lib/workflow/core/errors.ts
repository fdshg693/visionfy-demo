/**
 * ワークフロー関連のカスタムエラークラス
 *
 * このモジュールはエラー処理を統一的に提供：
 * - WorkflowImportError: インポート時のエラー
 * - WorkflowExportError: エクスポート時のエラー
 * - FormatConversionError: 形式変換時のエラー
 * - WorkflowValidationError: バリデーション時のエラー
 */

// ====================== Base Error ======================

/**
 * ワークフロー関連エラーの基底クラス
 */
export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowError';
    // TypeScriptのカスタムエラー対応
    Object.setPrototypeOf(this, WorkflowError.prototype);
  }
}

// ====================== Import Error ======================

/**
 * インポートエラーコード
 */
export type WorkflowImportErrorCode =
  | 'PARSE_ERROR'          // JSON解析エラー
  | 'INVALID_FORMAT'       // 形式が不正
  | 'VALIDATION_ERROR';    // バリデーションエラー

/**
 * ワークフローインポートエラー
 */
export class WorkflowImportError extends WorkflowError {
  constructor(
    message: string,
    public readonly code: WorkflowImportErrorCode
  ) {
    super(message);
    this.name = 'WorkflowImportError';
    Object.setPrototypeOf(this, WorkflowImportError.prototype);
  }
}

// ====================== Export Error ======================

/**
 * エクスポートエラーコード
 */
export type WorkflowExportErrorCode =
  | 'SERIALIZATION_ERROR'  // シリアライズエラー
  | 'DOWNLOAD_ERROR'       // ダウンロードエラー
  | 'INVALID_ENTRY';       // 無効なエントリ

/**
 * ワークフローエクスポートエラー
 */
export class WorkflowExportError extends WorkflowError {
  constructor(
    message: string,
    public readonly code: WorkflowExportErrorCode
  ) {
    super(message);
    this.name = 'WorkflowExportError';
    Object.setPrototypeOf(this, WorkflowExportError.prototype);
  }
}

// ====================== Format Conversion Error ======================

/**
 * 形式変換エラーコード
 */
export type FormatConversionErrorCode =
  | 'INVALID_SOURCE'       // 変換元が不正
  | 'CONVERSION_FAILED'    // 変換失敗
  | 'MISSING_DATA';        // 必要なデータが不足

/**
 * 形式変換エラー
 */
export class FormatConversionError extends WorkflowError {
  constructor(
    message: string,
    public readonly code: FormatConversionErrorCode
  ) {
    super(message);
    this.name = 'FormatConversionError';
    Object.setPrototypeOf(this, FormatConversionError.prototype);
  }
}

// ====================== Validation Error ======================

/**
 * バリデーションエラーコード
 */
export type WorkflowValidationErrorCode =
  | 'MISSING_FIELD'        // 必須フィールドが不足
  | 'INVALID_TYPE'         // 型が不正
  | 'INVALID_VALUE'        // 値が不正
  | 'UNKNOWN_FORMAT';      // 不明な形式

/**
 * ワークフローバリデーションエラー
 */
export class WorkflowValidationError extends WorkflowError {
  constructor(
    message: string,
    public readonly code: WorkflowValidationErrorCode
  ) {
    super(message);
    this.name = 'WorkflowValidationError';
    Object.setPrototypeOf(this, WorkflowValidationError.prototype);
  }
}
