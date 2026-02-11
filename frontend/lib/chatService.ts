/**
 * チャットサービス
 * 役割: Gemini モデルの初期化・メッセージ変換・ストリーム取得を抽象化
 * 依存: chatPrompts でプロンプト定義を管理、tools でLangChainツールを管理
 */
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  AIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { createAgent } from "langchain";
import { SYSTEM_PROMPT } from "./chatPrompts";
import { createLogger } from "./logger";
import { createEnabledTools, type ToolContext } from "./tools";
import type { ChatMessage, ChatMessageImage } from "@/types/chat";

const logger = createLogger('ChatService');

export type { ChatMessage, ChatMessageImage };

export class ChatService {
  private model: ChatGoogleGenerativeAI;

  constructor(apiKey: string) {
    logger.debug('Initializing ChatGoogleGenerativeAI model');
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-3-pro-preview",
      apiKey,
    });
    logger.info('ChatService initialized with model: gemini-3-pro-preview');
  }

  /**
   * 会話履歴からLangchainメッセージ配列を構築し、エージェントでストリーム処理する
   * toolContext が渡された場合はツールをエージェントに渡し、AIが必要に応じて実行できるようにする
   */
  async stream(messages: ChatMessage[], toolContext?: ToolContext, customSystemPrompt?: string, dynamicContext?: string) {
    logger.info({
      messageCount: messages.length,
      hasToolContext: !!toolContext,
      hasCustomPrompt: !!customSystemPrompt,
      hasDynamicContext: !!dynamicContext,
    }, 'Building langchain messages');
    
    const langchainMessages: BaseMessage[] = messages.map((msg) => {
      if (msg.role === "assistant") {
        return new AIMessage(msg.content);
      }

      // 画像がない場合はテキストのみ
      if (!msg.images || msg.images.length === 0) {
        return new HumanMessage(msg.content);
      }

      // マルチモーダルメッセージを構築（テキスト + 画像）
      const content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: string }
      > = [];

      // ファイル名情報をテキストに含める
      const imageLabels = msg.images
        .map((img, i) => `[添付画像${i + 1}: ${img.name}]`)
        .join(" ");
      content.push({
        type: "text",
        text: `${msg.content}\n\n${imageLabels}`,
      });

      // 各画像をimage_urlとして追加
      for (const image of msg.images) {
        content.push({
          type: "image_url",
          image_url: `data:${image.mimeType};base64,${image.base64}`,
        });
      }

      return new HumanMessage({ content });
    });

    // ツールコンテキストがある場合、有効なツールを生成してエージェントを作成
    const tools = toolContext ? createEnabledTools(toolContext) : [];
    logger.info({ toolCount: tools.length, toolNames: tools.map(t => t.name) }, 'Creating agent');
    
    if (tools.length > 0) {
      logger.debug({ tools: tools.map(t => ({ name: t.name, description: t.description })) }, 'Agent has tools available');
    }

    // エージェントを作成（ツールがない場合でも動作する）
    const basePrompt = customSystemPrompt ?? SYSTEM_PROMPT;
    const systemPrompt = dynamicContext ? `${basePrompt}${dynamicContext}` : basePrompt;
    const agent = createAgent({
      model: this.model,
      tools,
      systemPrompt,
    });

    logger.info({ totalMessages: langchainMessages.length }, 'Starting streamEvents');
    
    // streamEventsを使用してツール実行も含めた完全なストリームを取得
    return agent.streamEvents(
      { messages: langchainMessages },
      { version: "v2" }
    );
  }
}
