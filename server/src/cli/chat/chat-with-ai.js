import chalk from "chalk";
import boxen from "boxen";
import yoctoSpinner from "yocto-spinner";

import { text, isCancel, intro, outro } from "@clack/prompts";

import { marked } from "marked";
import { markedTerminal } from "marked-terminal";

import { AIService } from "../ai/google-service.js";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../commands/auth/login.js";
import prisma from "../../lib/db.js";

marked.use(
  markedTerminal({
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
  })
);

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

async function initConversation(userId, conversationId = null, mode = "chat") {
  const spinner = yoctoSpinner({ text: "Initializing conversation..." });
  spinner.start();
  try {
    const conversation = await chatService.getOrCreateConversation(
      userId,
      conversationId,
      mode
    );
    spinner.success("Conversation ready.");
    const infoBox = boxen(
      `${chalk.bold("Conversation")}: ${conversation.title}\n` +
        `${chalk.gray("ID: " + conversation.id)}\n` +
        `${chalk.gray("Mode: " + conversation.mode)}`,
      {
        padding: 1,
        margin: { top: 1, bottom: 1 },
        borderStyle: "round",
        borderColor: "cyan",
        title: "Chat Session",
        titleAlignment: "center",
      }
    );

    console.log(infoBox);

    if (conversation?.messages?.length > 0) {
      console.log(chalk.yellow("Previous messages:\n"));
      displayMessages(conversation.messages);
    }

    return conversation;
  } catch (err) {
    spinner.stop();
    throw err;
  }
}

function showConversationEndBox(conversation) {
  const endBox = boxen(
    `${chalk.bold.green("Conversation Ended")}\n\n` +
      `${chalk.gray("Title: " + conversation.title)}\n` +
      `${chalk.gray("ID: " + conversation.id)}\n` +
      `${chalk.gray("Mode: " + conversation.mode)}\n` +
      `${chalk.dim("Thank you for chatting. See you next time! 👋")}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "green",
      title: "Session Closed",
      titleAlignment: "center",
    }
  );

  console.log(endBox);
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

async function aiResponse(conversationId) {
  const spinner = yoctoSpinner({ text: "AI is thinking..." });
  spinner.start();

  const messages = await chatService.getMessages(conversationId);
  const aiMessages = chatService.formatMessagesForAI(messages);

  let fullResponse = "";
  let firstChunk = true;
  try {
    await aiService.sendMessage(aiMessages, (chunk) => {
      if (firstChunk) {
        spinner.stop();
        console.log("\n" + chalk.bold.green("Assistant:"));
        console.log(chalk.gray("-".repeat(60)));
        firstChunk = false;
      }

      fullResponse += chunk;
      process.stdout.write(chunk);
    });

    console.log("\n" + chalk.gray("-".repeat(60)) + "\n");
    return fullResponse;
  } catch (err) {
    spinner.stop();
    throw err;
  }
}

async function updateConversationTitle(conversation, userInput, messageCount) {
  if (messageCount !== 1) return;

  const title =
    userInput.length > 50 ? userInput.slice(0, 50) + "..." : userInput;

  await chatService.updateTitle(conversation.userId, conversation.id, title);
}

async function chatLoop(conversation) {
  console.log(
    boxen(
      `${chalk.gray("Type your message and press Enter")}\n` +
        `${chalk.gray("Markdown is supported in responses")}\n` +
        `${chalk.gray('Type "exit" to end the conversation')}\n` +
        `${chalk.gray("Press Ctrl + C to quit at any time")}`,
      {
        padding: 1,
        borderStyle: "round",
        borderColor: "gray",
        title: "Help",
      }
    )
  );

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
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });

      console.log(exitBox);
      break;
    }

       

    await saveMessage(conversation.id, "user", userInput);

    const messages = await chatService.getMessages(conversation.id);
    const reply = await aiResponse(conversation.id);

    await saveMessage(conversation.id, "assistant", reply);

    await updateConversationTitle(conversation, userInput, messages.length);
  }
  showConversationEndBox(conversation);
}

export async function startChat(mode = "chat", conversationId = null) {
  try {
    intro(
      boxen(chalk.bold.cyan("AI Agent CLI"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan",
      })
    );

    const user = await getUserFromToken();
    const conversation = await initConversation(user.id, conversationId, mode);

    await chatLoop(conversation);

    outro(chalk.green("Thanks for chatting!"));
  } catch (error) {
    console.error(
      boxen(chalk.red(`Error: ${error.message}`), {
        padding: 1,
        borderStyle: "round",
        borderColor: "red",
      })
    );
    process.exit(1);
  }
}
