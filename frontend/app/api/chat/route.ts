import { NextRequest, NextResponse } from "next/server";
import { ChatService, type ChatMessage } from "@/lib/chatService";
import { createLogger, logEnvVar } from "@/lib/logger";
import type { Node, Edge } from '@xyflow/react';

const logger = createLogger('ChatAPI');

/**
 * Gemini APIを使用してチャットメッセージに応答するエンドポイント
 * ストリーミングレスポンスを提供します。
 * AIツールを使用してワークフローコンテキストを動的に取得します。
 * @param req - 会話履歴とワークフロー情報を含むPOSTリクエスト
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, nodes, edges, originalImage, nodeResults, customSystemPrompt } = (await req.json()) as {
      messages: ChatMessage[];
      nodes?: Node[];
      edges?: Edge[];
      originalImage?: string;
      nodeResults?: { nodeId: string; functionName: string; result: string }[];
      customSystemPrompt?: string;
    };

    logger.info({
      messageCount: messages.length,
      hasNodes: !!nodes,
      hasEdges: !!edges,
      hasOriginalImage: !!originalImage,
      nodeResultCount: nodeResults?.length ?? 0,
    }, 'Chat request received');
    logger.debug({
      messages,
      nodeCount: nodes?.length ?? 0,
      edgeCount: edges?.length ?? 0
    }, 'Chat request details');

    if (!process.env.GEMINI_API_KEY) {
      logEnvVar(logger, 'GEMINI_API_KEY', process.env.GEMINI_API_KEY, true);
      return NextResponse.json(
        { error: "GEMINI_API_KEY が設定されていません" },
        { status: 500 }
      );
    }
    logger.debug('GEMINI_API_KEY is configured');

    const chatService = new ChatService(process.env.GEMINI_API_KEY);
    
    // ツールコンテキストの構築
    const toolContext = nodes && edges ? {
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      originalImage,
      nodeResults: nodeResults ? JSON.stringify(nodeResults) : undefined,
    } : undefined;
    
    logger.info({ hasToolContext: !!toolContext, hasCustomPrompt: !!customSystemPrompt }, 'Starting AI stream');
    const eventStream = await chatService.stream(messages, toolContext, customSystemPrompt);

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // streamEventsから返されるイベントを処理
          for await (const event of eventStream) {
            // LLMからのトークンストリーム
            if (event.event === 'on_chat_model_stream') {
              const content = event.data?.chunk?.content;
              if (content) {
                logger.debug({ content: String(content).substring(0, 50) }, 'Streaming token');
                controller.enqueue(encoder.encode(String(content)));
              }
            }
            // ツール実行開始
            else if (event.event === 'on_tool_start') {
              logger.info({ 
                tool: event.name, 
                input: event.data?.input 
              }, 'Tool execution started');
              // オプション: ツール実行中のメッセージをクライアントに送信
              // controller.enqueue(encoder.encode(`\n[${event.name}を実行中...]\n`));
            }
            // ツール実行終了
            else if (event.event === 'on_tool_end') {
              logger.info({ 
                tool: event.name, 
                output: event.data?.output 
              }, 'Tool execution completed');
            }
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
