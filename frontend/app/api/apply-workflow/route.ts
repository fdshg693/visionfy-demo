import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const logger = createLogger('ApplyWorkflowAPI');

/** セッションストアのエントリ型 */
interface SessionEntry {
  data: unknown;
  createdAt: number;
}

/**
 * インメモリのセッションストア
 * key: sessionId, value: ワークフローデータとタイムスタンプ
 */
const sessionStore = new Map<string, SessionEntry>();

/** セッションのTTL（5分） */
const SESSION_TTL_MS = 5 * 60 * 1000;

/**
 * セッションストアにワークフローデータを保存する
 * `generate_workflow` LangChainツール（サーバーサイド）から呼び出される
 * @param req - workflowDataとsessionIdを含むPOSTリクエスト
 * @returns 保存成功時に `{ success: true }` を返す
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    logger.info({ bodyKeys: Object.keys(body) }, 'POST: リクエストボディ受信');
    logger.debug({ body }, 'POST: リクエストボディ詳細');

    const { workflowData, sessionId } = body as {
      workflowData: unknown;
      sessionId: string;
    };

    if (!sessionId) {
      logger.warn('POST: sessionIdが指定されていません');
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!workflowData) {
      logger.warn({ sessionId }, 'POST: workflowDataが指定されていません');
      return NextResponse.json(
        { error: 'workflowData is required' },
        { status: 400 }
      );
    }

    logger.info({ sessionId, workflowDataType: typeof workflowData }, 'POST: ワークフローデータをセッションに保存します');
    logger.debug({ sessionId, workflowData }, 'POST: 保存するワークフローデータの内容');

    // 既存エントリがあれば上書き前にTTLタイマーをクリアする必要はない
    // （setTimeoutのIDを保持していないため、古いタイマーが発火しても
    //  既に削除済みか新しいエントリが入っているので問題ない）
    sessionStore.set(sessionId, {
      data: workflowData,
      createdAt: Date.now(),
    });

    logger.info({ sessionId, storeSize: sessionStore.size }, 'POST: セッションに保存完了');

    // 5分後に自動削除（TTL）
    setTimeout(() => {
      if (sessionStore.has(sessionId)) {
        sessionStore.delete(sessionId);
        logger.debug({ sessionId }, 'セッションがTTLにより期限切れで削除されました');
      }
    }, SESSION_TTL_MS);

    logger.info({ sessionId }, 'ワークフローデータをセッションに保存しました');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'ワークフローデータの保存中にエラーが発生しました');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * セッションストアからワークフローデータを取得する
 * ChatPanel（クライアントサイド）からストリーム完了後に呼び出される
 * 取得後にエントリは削除される（ワンタイムトークン方式）
 * @param req - sessionIdをクエリパラメータとして含むGETリクエスト
 * @returns ワークフローデータが見つかった場合 `{ workflowData }` を返す
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    logger.info({ sessionId }, 'GET: セッションからワークフローデータを取得開始');

    if (!sessionId) {
      logger.warn('GET: sessionIdが指定されていません');
      return NextResponse.json(
        { error: 'sessionId query parameter is required' },
        { status: 400 }
      );
    }

    logger.debug({ sessionId, storeSize: sessionStore.size }, 'セッションストアを確認');
    const entry = sessionStore.get(sessionId);

    if (!entry) {
      logger.warn({ sessionId, storeSize: sessionStore.size }, 'セッションが見つかりません（期限切れまたは未登録）');
      // デバッグ用: ストアに存在するキーをログ出力
      logger.debug({ availableKeys: Array.from(sessionStore.keys()) }, '現在のセッションストアのキー');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    logger.info({ sessionId, dataType: typeof entry.data }, 'セッションデータを取得しました');
    logger.debug({ sessionId, workflowData: entry.data }, 'ワークフローデータの内容');

    // ワンタイムトークン: 取得後に削除
    sessionStore.delete(sessionId);
    logger.info({ sessionId }, 'セッションをストアから削除しました');

    return NextResponse.json({ workflowData: entry.data });
  } catch (error) {
    logger.error({ error }, 'ワークフローデータの取得中にエラーが発生しました');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
