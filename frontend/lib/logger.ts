/**
 * Pino Logger 設定
 * サーバーサイド・クライアントサイド両方で動作するロガー
 * 本番環境ではGoogle Cloud Loggingに統合
 */
import pino from "pino";

const isServer = typeof window === "undefined";
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
// ビルド時はCloud Loggingを無効化（環境変数で明示的に有効化された場合のみ使用）
const enableCloudLogging = process.env.ENABLE_CLOUD_LOGGING === "true";

// 環境変数のログレベル（デフォルト: development=debug, production=info）
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

// severityレベルのマッピング（Cloud Logging用）
const formatters = {
  level(label: string, number: number) {
    return {
      severity: label.toUpperCase(),
      level: number,
    };
  },
};

// サーバーサイド用の設定
const serverConfig: pino.LoggerOptions = {
  level: logLevel,
  formatters,
  // 開発環境では pino-pretty を使用
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
  // 本番環境ではCloud Loggingは環境変数で制御（オプション機能）
  // 注: Cloud Logging統合が必要な場合は別途設定してください
};

// クライアントサイド用の設定（ブラウザ向け）
const browserConfig: pino.LoggerOptions = {
  level: logLevel,
  browser: {
    asObject: true,
  },
};

// ルートロガー
const rootLogger = pino(isServer ? serverConfig : browserConfig);

/**
 * 子ロガーを作成するファクトリ関数
 * @param module - モジュール名（例: "BackendApiService", "ChatService"）
 */
export function createLogger(module: string) {
  return rootLogger.child({ module });
}

/**
 * 環境変数のログ出力ヘルパー
 * 機密情報はマスクして出力
 */
export function logEnvVar(
  logger: pino.Logger,
  name: string,
  value: string | undefined,
  isSensitive = false
) {
  if (value === undefined || value === "") {
    logger.warn({ envVar: name }, `Environment variable ${name} is not set`);
  } else {
    const displayValue = isSensitive ? `${value.slice(0, 4)}****` : value;
    logger.info(
      { envVar: name, value: displayValue },
      `Environment variable ${name} loaded`
    );
  }
}

/**
 * Cloud Trace統合のためのトレースIDを取得
 * @param req - Next.js Request object
 * @returns trace ID (projects/{PROJECT_ID}/traces/{TRACE_ID})
 */
export function getTraceId(req: Request): string | undefined {
  if (typeof window !== "undefined") return undefined;

  // Cloud RunではX-Cloud-Trace-ContextヘッダーからトレースIDを取得
  // フォーマット: TRACE_ID/SPAN_ID;o=TRACE_TRUE
  const traceHeader = req.headers.get("x-cloud-trace-context");
  if (traceHeader) {
    const traceId = traceHeader.split("/")[0];
    const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    if (projectId && traceId) {
      return `projects/${projectId}/traces/${traceId}`;
    }
    return traceId;
  }

  return undefined;
}

/**
 * HTTPリクエストコンテキストを取得（Cloud Logging用）
 * @param req - Next.js Request object
 * @param method - HTTP method
 * @param url - Request URL
 * @param status - Response status code
 */
export function getHttpContext(
  req: Request,
  method: string,
  url: string,
  status?: number
) {
  return {
    httpRequest: {
      requestMethod: method,
      requestUrl: url,
      status: status || 200,
      userAgent: req.headers.get("user-agent") || undefined,
      remoteIp: req.headers.get("x-forwarded-for")?.split(",")[0] || undefined,
      referer: req.headers.get("referer") || undefined,
    },
  };
}

/**
 * ロガーにHTTPコンテキストとトレースIDを追加
 * @param logger - Pino logger instance
 * @param req - Next.js Request object
 * @param method - HTTP method
 * @param url - Request URL
 * @returns Child logger with HTTP context and trace ID
 */
export function withHttpContext(
  logger: pino.Logger,
  req: Request,
  method: string,
  url: string
) {
  const traceId = getTraceId(req);
  const httpContext = getHttpContext(req, method, url);

  return logger.child({
    ...httpContext,
    ...(traceId && { "logging.googleapis.com/trace": traceId }),
  });
}

export default rootLogger;
