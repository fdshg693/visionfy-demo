/**
 * チャットサービス
 * 役割: Gemini モデルの初期化・メッセージ変換・ストリーム取得を抽象化
 * 依存: chatPrompts でプロンプト定義を管理
 */
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { SYSTEM_PROMPT } from "./chatPrompts";
import { createLogger } from "./logger";

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
   * 会話履歴からLangchainメッセージ配列を構築し、ストリーマブルレスポンスを返す
   * workflowContext が渡された場合はシステムプロンプトに付与する
   */
  async stream(messages: ChatMessage[], workflowContext?: string) {
    const systemContent = workflowContext
      ? `${SYSTEM_PROMPT}\n\n${workflowContext}`
      : SYSTEM_PROMPT;

    logger.info({ messageCount: messages.length, hasWorkflowContext: !!workflowContext }, 'Building langchain messages');
    logger.debug({ systemPromptLength: systemContent.length }, 'System prompt prepared');
    
    // AIに渡す内容をログ出力
    logger.debug({ 
      systemContent: systemContent.substring(0, 500) + (systemContent.length > 500 ? '...' : ''),
      userMessages: messages.map(m => ({ role: m.role, contentPreview: m.content.substring(0, 100) }))
    }, 'Content being sent to AI');

    const langchainMessages = [
      new SystemMessage(systemContent),
      ...messages.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
    ];

    logger.info({ totalMessages: langchainMessages.length }, 'Starting stream to Gemini API');
    return this.model.stream(langchainMessages);
  }
}
