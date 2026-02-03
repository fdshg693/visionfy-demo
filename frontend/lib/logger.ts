/**
 * Pino Logger 設定
 * サーバーサイド・クライアントサイド両方で動作するロガー
 */
import pino from "pino";

const isServer = typeof window === "undefined";
const isDevelopment = process.env.NODE_ENV === "development";

// 環境変数のログレベル（デフォルト: development=debug, production=info）
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

// サーバーサイド用の設定
const serverConfig: pino.LoggerOptions = {
  level: logLevel,
  // 開発環境では pino-pretty を使用（別途 pnpm add -D pino-pretty が必要）
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

export default rootLogger;
