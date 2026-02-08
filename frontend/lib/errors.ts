/**
 * エラー型定義
 * 役割: アプリケーション全体で統一されたエラーハンドリングを提供
 */

/**
 * エラーカテゴリー
 */
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  PROCESSING = 'processing',
  UNKNOWN = 'unknown',
}

/**
 * エラーの深刻度
 */
export enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * アプリケーションエラーの基底クラス
 */
export class AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  technicalDetails?: string;
  statusCode?: number;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    userMessage?: string,
    technicalDetails?: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.severity = severity;
    this.userMessage = userMessage || message;
    this.technicalDetails = technicalDetails;
    this.statusCode = statusCode;

    // TypeScript向けのプロトタイプチェーン修正
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * ネットワークエラー
 */
export class NetworkError extends AppError {
  constructor(message: string, statusCode?: number, technicalDetails?: string) {
    super(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.ERROR,
      'ネットワークエラーが発生しました。接続を確認してください。',
      technicalDetails,
      statusCode
    );
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message: string, userMessage?: string, technicalDetails?: string) {
    super(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.WARNING,
      userMessage || '入力データが正しくありません。',
      technicalDetails
    );
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 処理エラー
 */
export class ProcessingError extends AppError {
  nodeId?: string;

  constructor(
    message: string,
    userMessage?: string,
    technicalDetails?: string,
    nodeId?: string
  ) {
    super(
      message,
      ErrorCategory.PROCESSING,
      ErrorSeverity.ERROR,
      userMessage || '画像処理中にエラーが発生しました。',
      technicalDetails
    );
    this.name = 'ProcessingError';
    this.nodeId = nodeId;
    Object.setPrototypeOf(this, ProcessingError.prototype);
  }
}

/**
 * エラー分類ヘルパー関数
 */
export function categorizeError(error: unknown): AppError {
  // すでにAppErrorの場合はそのまま返す
  if (error instanceof AppError) {
    return error;
  }

  // Fetch API エラー
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new NetworkError(
      'Network request failed',
      undefined,
      error.message
    );
  }

  // 一般的なErrorオブジェクト
  if (error instanceof Error) {
    // メッセージからエラー種別を推測
    const message = error.message.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout')
    ) {
      return new NetworkError(error.message, undefined, error.stack);
    }

    if (
      message.includes('invalid') ||
      message.includes('validation') ||
      message.includes('not found')
    ) {
      return new ValidationError(error.message, undefined, error.stack);
    }

    if (message.includes('processing') || message.includes('failed')) {
      return new ProcessingError(error.message, undefined, error.stack);
    }

    // デフォルトは処理エラー
    return new ProcessingError(error.message, undefined, error.stack);
  }

  // 不明なエラー
  return new AppError(
    String(error),
    ErrorCategory.UNKNOWN,
    ErrorSeverity.ERROR,
    '予期しないエラーが発生しました。'
  );
}

/**
 * HTTPステータスコードからエラーを生成
 */
export function createErrorFromStatus(
  status: number,
  statusText: string,
  responseBody?: string
): AppError {
  if (status >= 500) {
    return new NetworkError(
      `Server error: ${statusText}`,
      status,
      responseBody
    );
  }

  if (status === 404) {
    return new ValidationError(
      'Resource not found',
      'リクエストされたリソースが見つかりません。',
      responseBody
    );
  }

  if (status === 400) {
    return new ValidationError(
      'Bad request',
      'リクエストが正しくありません。',
      responseBody
    );
  }

  if (status >= 400 && status < 500) {
    return new ValidationError(
      `Client error: ${statusText}`,
      'リクエストエラーが発生しました。',
      responseBody
    );
  }

  return new NetworkError(
    `HTTP ${status}: ${statusText}`,
    status,
    responseBody
  );
}
