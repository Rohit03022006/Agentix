import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  streamText,
  TextStreamChatTransport,
} from "ai";
import { googleConfig } from "../../config/google.config.js";
import chalk from "chalk";
import { config } from "dotenv";

export class AIService {
  constructor() {
    if (!googleConfig.googleApiKey) {
      throw new Error("Google API key is not configured in .env file.");
    }

    if (!googleConfig.model || typeof googleConfig.model !== "string") {
      throw new Error(
        `Invalid model configuration: ${googleConfig.model}. Expected a string model name like 'gemini-1.5-flash'.`
      );
    }

    this.modelId = googleConfig.model;
  }

  /**
   * send a massage and get streaming response
   * @param {Array} message
   * @param {function} onChunk
   * @param {object} options
   * @param {function} onToolCall
   * @returns {Promise<void>}
   */
  async sendMessage(message, onChunk, tools = undefined, onToolCall = null) {
    try {
      if (tools && Object.keys(tools).length > 0) {
        console.log(
          chalk.gray(`[DEBUG] Tools enabled: ${Object.keys(tools).join(", ")}`)
        );
      }

      const result = streamText({
        model: google(this.modelId),
        messages: message,
        tools,
        maxSteps: tools && Object.keys(tools).length > 0 ? 5 : undefined,
      });

      let fullResponse = "";

      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        onChunk?.(chunk);
      }

      const toolCalls = [];
      const toolResults = [];

      if (Array.isArray(result.steps)) {
        for (const step of result.steps) {
          if (step.toolCalls?.length) {
            for (const toolCall of step.toolCalls) {
              toolCalls.push(toolCall);
              onToolCall?.(toolCall);
            }
          }

          if (step.toolResults?.length) {
            toolResults.push(...step.toolResults);
          }
        }
      }

      return {
        content: fullResponse,
        finishReason: result.finishReason,
        usage: result.usage,
        toolCalls,
        toolResults,
        steps: result.steps,
      };
    } catch (error) {
      console.log(chalk.red("Error in Google AI Service:"), error);
      throw error;
    }
  }

  /**
   * get a non-streaming response
   * @param {Array} message
   * @param {object} tools
   * @returns {Promise<string>}
   */
  async getMassage(message, tools = undefined) {
    let fullResponse = "";
    const result = await this.sendMessage(
      message,
      (chunk) => {
        fullResponse += chunk;
      },
      tools
    );
    return result.content;
  }
}
