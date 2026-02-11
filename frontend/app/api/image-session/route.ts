import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const logger = createLogger('ImageSessionAPI');

/** セッションストアのエントリ型 */
interface SessionEntry {
  data: unknown;
  createdAt: number;
}

/**
 * インメモリのセッションストア
 * key: sessionId, value: 画像データとタイムスタンプ
 */
const sessionStore = new Map<string, SessionEntry>();

/** セッションのTTL（5分） */
const SESSION_TTL_MS = 5 * 60 * 1000;

/**
 * セッションストアに画像データを保存する
 * `get_image` LangChainツール（サーバーサイド）から呼び出される
 * @param req - imageDataとsessionIdを含むPOSTリクエスト
 * @returns 保存成功時に `{ success: true }` を返す
 */
export async function POST(req: NextRequest) {
  try {
    const { imageData, sessionId } = (await req.json()) as {
      imageData: unknown;
      sessionId: string;
    };

    if (!sessionId) {
      logger.warn('POST: sessionIdが指定されていません');
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!imageData) {
      logger.warn({ sessionId }, 'POST: imageDataが指定されていません');
      return NextResponse.json(
        { error: 'imageData is required' },
        { status: 400 }
      );
    }

    sessionStore.set(sessionId, {
      data: imageData,
      createdAt: Date.now(),
    });

    // 5分後に自動削除（TTL）
    setTimeout(() => {
      if (sessionStore.has(sessionId)) {
        sessionStore.delete(sessionId);
        logger.debug({ sessionId }, 'セッションがTTLにより期限切れで削除されました');
      }
    }, SESSION_TTL_MS);

    logger.info({ sessionId }, '画像データをセッションに保存しました');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, '画像データの保存中にエラーが発生しました');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * セッションストアから画像データを取得する
 * ChatPanel（クライアントサイド）からストリーム完了後に呼び出される
 * 取得後にエントリは削除される（ワンタイムトークン方式）
 * @param req - sessionIdをクエリパラメータとして含むGETリクエスト
 * @returns 画像データが見つかった場合 `{ imageData }` を返す
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      logger.warn('GET: sessionIdが指定されていません');
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    const entry = sessionStore.get(sessionId);

    if (!entry) {
      logger.debug({ sessionId }, 'セッションが見つかりません（期限切れまたは未登録）');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // ワンタイムトークン: 取得後に削除
    sessionStore.delete(sessionId);

    logger.info({ sessionId }, '画像データを取得・削除しました');

    return NextResponse.json({ imageData: entry.data });
  } catch (error) {
    logger.error({ error }, '画像データの取得中にエラーが発生しました');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
