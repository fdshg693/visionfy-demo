import { NextRequest, NextResponse } from "next/server";
import { ChatService } from "@/lib/chatService";
import { buildImageContext } from "@/lib/chatPrompts";
import type { ChatMessage } from "@/types/chat";
import { createLogger, logEnvVar, withHttpContext } from "@/lib/logger";
import type { Node, Edge } from '@xyflow/react';

const baseLogger = createLogger('ChatAPI');

/**
 * Gemini APIを使用してチャットメッセージに応答するエンドポイント
 * ストリーミングレスポンスを提供します。
 * AIツールを使用してワークフローコンテキストを動的に取得します。
 * @param req - 会話履歴とワークフロー情報を含むPOSTリクエスト
 */
export async function POST(req: NextRequest) {
  // HTTPコンテキストとトレースIDを含むロガーを作成
  const logger = withHttpContext(baseLogger, req, 'POST', req.url);

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
    
    // 画像コンテキストの構築（システムプロンプトに動的に付加）
    const imageContext = buildImageContext(originalImage, nodeResults);

    logger.info({ hasToolContext: !!toolContext, hasCustomPrompt: !!customSystemPrompt, hasImageContext: !!imageContext }, 'Starting AI stream');
    const eventStream = await chatService.stream(messages, toolContext, customSystemPrompt, imageContext || undefined);

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // streamEventsから返されるイベントを処理
          for await (const event of eventStream) {
            // 未処理のイベントタイプを検出するためにログ出力
            if (
              event.event !== 'on_chat_model_stream' &&
              event.event !== 'on_tool_start' &&
              event.event !== 'on_tool_end'
            ) {
              logger.debug({ eventType: event.event, eventName: event.name }, 'Unhandled stream event');
            }

            // LLMからのトークンストリーム
            if (event.event === 'on_chat_model_stream') {
              const chunk = event.data?.chunk;
              const content = chunk?.content;
              // ツールコールチャンクの検出（LLMがfunction callingで返した場合）
              const toolCallChunks = chunk?.tool_call_chunks;
              if (toolCallChunks && toolCallChunks.length > 0) {
                logger.info({ toolCallChunks }, 'Tool call chunks detected in stream');
              }
              if (content) {
                logger.debug({ content: String(content).substring(0, 80) }, 'Streaming token');
                controller.enqueue(encoder.encode(String(content)));
              }
            }
            // ツール実行開始
            else if (event.event === 'on_tool_start') {
              logger.info({ 
                tool: event.name, 
                input: event.data?.input 
              }, 'Tool execution started');
              controller.enqueue(encoder.encode(`<<TOOL_START:${event.name}>>`));
            }
            // ツール実行終了
            else if (event.event === 'on_tool_end') {
              const output = event.data?.output;
              logger.info({
                tool: event.name,
                output: output
              }, 'Tool execution completed');

              // ツールの出力をログに記録（デバッグ用）
              if (output) {
                // ToolMessageオブジェクトの場合はcontentプロパティを取得
                const outputContent = typeof output === 'object' && output !== null && 'content' in output
                  ? String(output.content)
                  : String(output);

                logger.debug({ tool: event.name, outputContent }, 'Tool output content');

                // ツールの出力がセッションマーカーを含む場合、それをストリームに含める
                if (outputContent.includes('[WORKFLOW_SESSION:') || outputContent.includes('[IMAGE_SESSION:')) {
                  logger.info({ tool: event.name, marker: 'Detected session marker in tool output', content: outputContent }, 'Including tool output in stream');
                  controller.enqueue(encoder.encode(outputContent));
                }
              }

              controller.enqueue(encoder.encode(`<<TOOL_END:${event.name}>>`));
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
