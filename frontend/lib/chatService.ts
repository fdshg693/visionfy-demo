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

const logger = createLogger('ChatService');

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export class ChatService {
  private model: ChatGoogleGenerativeAI;

  constructor(apiKey: string) {
    logger.debug('Initializing ChatGoogleGenerativeAI model');
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-pro",
      apiKey,
    });
    logger.info('ChatService initialized with model: gemini-2.5-pro');
  }

  /**
   * 会話履歴からLangchainメッセージ配列を構築し、エージェントでストリーム処理する
   * toolContext が渡された場合はツールをエージェントに渡し、AIが必要に応じて実行できるようにする
   */
  async stream(messages: ChatMessage[], toolContext?: ToolContext) {
    logger.info({ 
      messageCount: messages.length, 
      hasToolContext: !!toolContext 
    }, 'Building langchain messages');
    
    const langchainMessages: BaseMessage[] = messages.map((msg) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    );

    // ツールコンテキストがある場合、有効なツールを生成してエージェントを作成
    const tools = toolContext ? createEnabledTools(toolContext) : [];
    logger.info({ toolCount: tools.length, toolNames: tools.map(t => t.name) }, 'Creating agent');
    
    if (tools.length > 0) {
      logger.debug({ tools: tools.map(t => ({ name: t.name, description: t.description })) }, 'Agent has tools available');
    }

    // エージェントを作成（ツールがない場合でも動作する）
    const agent = createAgent({
      model: this.model,
      tools,
      systemPrompt: SYSTEM_PROMPT,
    });

    logger.info({ totalMessages: langchainMessages.length }, 'Starting streamEvents');
    
    // streamEventsを使用してツール実行も含めた完全なストリームを取得
    return agent.streamEvents(
      { messages: langchainMessages },
      { version: "v2" }
    );
  }
}
