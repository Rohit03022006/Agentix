import { google } from "@ai-sdk/google";
import { streamText, TextStreamChatTransport } from "ai";
import { googleConfig } from "../../config/google.config.js";
import chalk from "chalk";
import { config } from "dotenv";

export class AIService {
  constructor() {
    if (!googleConfig.googleApiKey) {
      throw new Error("Google API key is not configured in .env file.");
    }

    this.model = google.googleGenerativeAI({
      apiKey: googleConfig.googleApiKey,
      model: googleConfig.model,
    });
  }

  /**
   * send a massage and get streaming response
   * @param {Array} message
   * @param {function} onChunk
   * @param {object} options
   * @param {function} onToolCall
   * @returns {Promise<void>}
   */
  async sendMessage(message, onChunk, tool = undefined, onToolCall = null) {
    try {
      const streamConfig = {
        model: this.model,
        messages: message,
      };
      const result = streamText(streamConfig);

      let fullResponse = "";
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }
      const fullResult = result;

      return {
        content: fullResponse,
        finishResponse: fullResult.finishReason,
        usage: fullResult.usage,
      };
    } catch (error) {
      console.log(chalk.red("Error in Google AI Service: "), error);
      throw error;
    }
  }

  /**
   * get a non-streaming response
   * @param {Array} message
   * @param {object} tool
   * @returns {Promise<string>}
   */
  async getMassage(message, tool = undefined) {
    let fullResponse = "";
    await this.sendMessage(message, (chunk) => {
      fullResponse += chunk;
    });
    return fullResponse;
  }
}
