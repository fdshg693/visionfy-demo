import { NextRequest, NextResponse } from "next/server";
import { ChatService, type ChatMessage } from "@/lib/chatService";

/**
 * Gemini APIを使用してチャットメッセージに応答するエンドポイント
 * ストリーミングレスポンスを提供します。
 * @param req - 会話履歴を含むPOSTリクエスト
 */
export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY が設定されていません" },
        { status: 500 }
      );
    }

    const chatService = new ChatService(process.env.GEMINI_API_KEY);
    const stream = await chatService.stream(messages);

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(String(chunk.content)));
          }
        } catch (err) {
          console.error("Streaming error:", err);
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
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "リクエスト処理に失敗しました" },
      { status: 500 }
    );
  }
}
