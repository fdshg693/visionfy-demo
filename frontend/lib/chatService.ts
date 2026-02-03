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

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export class ChatService {
  private model: ChatGoogleGenerativeAI;

  constructor(apiKey: string) {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-pro",
      apiKey,
    });
  }

  /**
   * 会話履歴からLangchainメッセージ配列を構築し、ストリーマブルレスポンスを返す
   * workflowContext が渡された場合はシステムプロンプトに付与する
   */
  async stream(messages: ChatMessage[], workflowContext?: string) {
    const systemContent = workflowContext
      ? `${SYSTEM_PROMPT}\n\n${workflowContext}`
      : SYSTEM_PROMPT;

    const langchainMessages = [
      new SystemMessage(systemContent),
      ...messages.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
    ];

    return this.model.stream(langchainMessages);
  }
}
