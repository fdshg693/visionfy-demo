import { NextRequest, NextResponse } from "next/server";
import { ChatService, type ChatMessage } from "@/lib/chatService";
import { createLogger, logEnvVar } from "@/lib/logger";

const logger = createLogger('ChatAPI');

/**
 * Gemini APIを使用してチャットメッセージに応答するエンドポイント
 * ストリーミングレスポンスを提供します。
 * @param req - 会話履歴を含むPOSTリクエスト
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, workflowContext } = (await req.json()) as {
      messages: ChatMessage[];
      workflowContext?: string;
    };

    logger.info({ messageCount: messages.length, hasWorkflowContext: !!workflowContext }, 'Chat request received');
    logger.debug({ messages, workflowContext }, 'Chat request details');

    if (!process.env.GEMINI_API_KEY) {
      logEnvVar(logger, 'GEMINI_API_KEY', process.env.GEMINI_API_KEY, true);
      return NextResponse.json(
        { error: "GEMINI_API_KEY が設定されていません" },
        { status: 500 }
      );
    }
    logger.debug('GEMINI_API_KEY is configured');

    const chatService = new ChatService(process.env.GEMINI_API_KEY);
    logger.info('Starting AI stream');
    const stream = await chatService.stream(messages, workflowContext);

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(String(chunk.content)));
          }
          logger.info('AI stream completed successfully');
        } catch (err) {
          logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Streaming error');
          controller.enqueue(
            encoder.encode("ストリーミング中にエラーが発生しました。")
          );
        }
        controller.close();
      },
    });

    return new NextResponse(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Chat API error');
    return NextResponse.json(
      { error: "リクエスト処理に失敗しました" },
      { status: 500 }
    );
  }
}
