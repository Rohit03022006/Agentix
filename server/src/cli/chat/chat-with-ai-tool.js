import chalk from "chalk";
import boxen from "boxen";
import {
  text,
  isCancel,
  cancel,
  intro,
  outro,
  multiselect,
} from "@clack/prompts";

import yoctoSpinner from "yocto-spinner";
import { marked } from "marked";
import markedTerminal from "marked-terminal";

import { AIService } from "../ai/google-service.js";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../commands/auth/login.js";

import prisma from "../../lib/db.js";

import {
  availableTools,
  getEnabledTools,
  enableTools,
  getEnabledToolNames,
  resetTools,
} from "../../config/tools.config.js";

const terminalRenderer = new markedTerminal({
  code: chalk.cyan,
  blockquote: chalk.gray.italic,
  heading: chalk.green.bold,
  firstHeading: chalk.magenta.underline.bold,
  hr: chalk.reset,
  listitem: chalk.reset,
  list: chalk.reset,
  paragraph: chalk.reset,
  strong: chalk.bold,
  em: chalk.italic,
  codespan: chalk.yellow.bgBlack,
  del: chalk.dim.strikethrough,
  link: chalk.blue.underline,
  href: chalk.blue.underline,
});

marked.setOptions({
  renderer: terminalRenderer,
});



const aiService = new AIService();
const chatService = new ChatService();

async function getUserFromToken() {
  const token = await getStoredToken();
  if (!token?.access_token) {
    throw new Error("Not authenticated. Please log in.");
  }
  const spinner = yoctoSpinner({ text: "Authenticating..." });
  spinner.start();

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.access_token },
      },
    },
  });

  if (!user) {
    spinner.stop();
    throw new Error("User not found.");
  }

  spinner.success(`Welcome back, ${user.name}!`);
  return user;
}

async function selectTools() {
  const toolOptions = availableTools.map((tool) => ({
    value: tool.id,
    label: tool.name,
    hint: tool.description,
  }));

  const selectedTools = await multiselect({
    message: chalk.cyan(
      "Select tools to enable (space to select, Enter to confirm): "
    ),
    options: toolOptions,
    required: false,
  });

  if (isCancel(selectedTools)) {
    cancel(chalk.yellow("Tool selection cancelled"));
    process.exit(0);
  }

  enableTools(selectedTools);
  if (selectedTools.length === 0) {
    console.log(
      chalk.yellow("\nNo tools selected. AI will work without tools.\n")
    );
  } else {
    const toolsBox = boxen(
      chalk.green(
        `Enabled tools:\n\n${selectedTools
          .map((id) => {
            const tool = availableTools.find((t) => t.id === id);
            return tool ? `- ${tool.name}` : null;
          })
          .join("\n")}`
      ),
      {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "Active Tools",
        titleAlignment: "center",
      }
    );

    console.log(toolsBox);
  }

  return selectedTools.length > 0;
}

async function initConversation(userId, conversationId = null, mode = "tool") {
  const spinner = yoctoSpinner({ text: "Initializing conversation..." });
  spinner.start();

  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    mode
  );

  spinner.success("Conversation loaded");
  const enabledToolNames = getEnabledToolNames();

  const toolsDisplay =
    enabledToolNames.length > 0
      ? `\n${chalk.gray("Active Tools:")} ${enabledToolNames.join(", ")}`
      : `\n${chalk.gray("No tools enabled")}`;

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title}
${chalk.gray("ID: " + conversation.id)}
${chalk.gray("Mode: " + conversation.mode)}${toolsDisplay}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "• Tool Calling Session",
      titleAlignment: "center",
    }
  );

  console.log(conversationInfo);

  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("Previous messages:\n"));
    displayMessages(conversation.messages);
  }

  return conversation;
}

function displayMessages(messages) {
  messages.forEach((msg) => {
    if (msg.role === "user") {
      console.log(
        boxen(chalk.white(msg.content), {
          padding: 1,
          borderStyle: "round",
          borderColor: "gray",
          title: "You",
        })
      );
    } else {
      console.log(
        boxen(marked.parse(msg.content).trim(), {
          padding: 1,
          borderStyle: "round",
          borderColor: "cyan",
          title: "AI",
        })
      );
    }
  });
}

async function saveMessage(conversationId, role, content) {
  return await chatService.addMessage(conversationId, role, content);
}

async function getAiResponse(conversationId) {
  const spinner = yoctoSpinner({ text: "Ai is thinking" }).start();

  const dbmessage = await chatService.getMessages(conversationId);
  const aiMessages = chatService.formatMessagesForAI(dbmessage);

  const tools = getEnabledTools();

  let fullResponse = "";
  let isFirstChunk = true;

  const toolCallsDetected = [];

  try {
    const result = await aiService.sendMessage(
      aiMessages,
      (chunk) => {
        if (isFirstChunk) {
          spinner.stop();
          console.log("\n");
          const header = chalk.green.bold("Assistant:");
          console.log(header);
          console.log(chalk.gray("-".repeat(60)));
          isFirstChunk = false;
        }
        fullResponse += chunk;
      },
      tools,
      (toolCall) => {
        toolCallsDetected.push(toolCall);
      }
    );

    if (toolCallsDetected.length > 0) {
      console.log("\n");
      const toolCallBox = boxen(
        toolCallsDetected
          .map(
            (tc) =>
              `${chalk.cyan("Tool:")} ${tc.toolName}${chalk.gray(
                "Args:"
              )} ${JSON.stringify(tc.args, null, 2)}`
          )
          .join("\n"),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "cyan",
          title: "Tool Calls",
          titleAlignment: "center",
        }
      );

      console.log(toolCallBox);
    } 

    if (result.toolResults && result.toolResults.length > 0) {
      const toolResultBox = boxen(
        result.toolResults
          .map(
            (tr) =>
              `${chalk.green("Tool:")} ${tr.toolName} ${chalk.gray("Result:")} ${JSON.stringify(tr.result, null, 2).slice(0, 200)}...`
          )
          .join("\n"),
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
          title: "Tool Results",
          titleAlignment: "center",
        }
      );

      console.log(toolResultBox);
    }

    console.log("\n");
    const renderedMarkdown = marked.parse(fullResponse);
    console.log(renderedMarkdown);
    console.log(chalk.gray("-".repeat(60)));
    console.log("\n");

    return result.content;
  } catch (error) {
    spinner.error("Failed to get AI response");
    throw error;
  }
}

async function updateConversationTitle(conversation, userInput, messageCount) {
  if (messageCount !== 1) return;

  const title =
    userInput.length > 50 ? userInput.slice(0, 50) + "..." : userInput;

  await chatService.updateTitle(conversation.userId, conversation.id, title);
}

async function chatLoop(conversation) {
  const enabledToolNames = getEnabledToolNames();

  const helpBox = boxen(
    `${chalk.gray("Type your message and press Enter")}${chalk.gray(
      "AI has access to:"
    )} ${
      enabledToolNames.length > 0 ? enabledToolNames.join(", ") : "- No tools"
    }${chalk.gray('- Type "exit" to end conversation')}${chalk.gray(
      "- Press Ctrl+C to quit anytime"
    )}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
      dimBorder: true,
    }
  );

  console.log(helpBox);

  while (true) {
    const userInput = await text({
      message: chalk.blue("Your message"),
      placeholder: "Type here...",
      validate(v) {
        if (!v || !v.trim()) return "Message cannot be empty";
      },
    });

    if (isCancel(userInput)) {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye!"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });

      console.log(exitBox);
      process.exit(0);
    }

    if (userInput.trim().toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye!"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { left: 2, top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "You",
      titleAlignment: "center",
    });

    console.log(userBox);

    await saveMessage(conversation.id, "user", userInput);

    const messages = await chatService.getMessages(conversation.id);

    const aiResponse = await getAiResponse(conversation.id);

    await saveMessage(conversation.id, "assistant", aiResponse);

    await updateConversationTitle(conversation, userInput, messages.length);
  }
}

export async function startToolChat(conversationId = null) {
  try {
    intro(
      boxen(chalk.bold.cyan("AI Agent CLI - Tool Calling Mode"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan",
      })
    );

    const user = await getUserFromToken();

    await selectTools();

    const conversation = await initConversation(
      user.id,
      conversationId,
      "tool"
    );

    await chatLoop(conversation);

    resetTools();

    outro(chalk.green("Thanks for using Tools"));
  } catch (error) {
    const errorBox = boxen(chalk.red(`Error: ${error.message}`), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "red",
    });
    console.log(errorBox);
    resetTools();
    process.exit(1);
  }
}
