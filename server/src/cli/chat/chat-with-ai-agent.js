import chalk from "chalk";
import boxen from "boxen";
import { text, isCancel, cancel, intro, outro, confirm } from "@clack/prompts";
import { ChatService } from "../../service/chat.service.js";
import { getStoredToken } from "../commands/auth/login.js";
import { generateApplication } from "../../config/agent.config.js";
import yoctoSpinner from "yocto-spinner";
import prisma from "../../lib/db.js";


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


async function initConversation(userId, conversationId = null, mode = "agent") {
    const spinner = yoctoSpinner({ text: "Initializing conversation..." });
    spinner.start();

    const conversation = await chatService.getOrCreateConversation(
        userId,
        conversationId,
        mode
    );

    spinner.success("Conversation loaded");

    const conversationInfo = boxen(
        `${chalk.bold("Conversation")}: ${conversation.title}\n` +
        `${chalk.gray("ID: ")} ${conversation.id}\n` +
        `${chalk.gray("Mode: ")} ${conversation.mode}` +
        `${chalk.gray("Woking Directory: ")} ${process.cwd()}\n` +
        {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: "round",
            borderColor: "magenta",
            title: "• Agent Mode",
            titleAlignment: "center",
        }
    );

    console.log(conversationInfo);

    return conversation;
}


async function saveMessage(conversationId, role, content) {
    return await chatService.addMessage(conversationId, role, content);
}


async function agentLoop(conversation) {
    const helpBox = boxen(
        `${chalk.cyan.bold("What can the agent do? \n\n")}` +
        `${chalk.gray("1. Generate complete application from description\n")}` +
        `${chalk.gray("2. Generate all necessary files and folders for application\n")}` +
        `${chalk.gray("3. Include setup instructions and commands for application\n")}` +
        `${chalk.gray("4. Generate Production ready application\n")}` +
        `${chalk.yellow.bold("Example: \n")}` +
        `${chalk.white("i) Build a todo app with react and tailwindcss\n")}` +
        `${chalk.white("ii) Create a REST API with express and MongoDB\n")}` +
        `${chalk.white("iii) Make Weather app using OpenWeatherMap API\n")}` +
        `${chalk.white("iv) Make a simple calculator app\n")}` +
        `${chalk.gray("Type 'exit' to exit the agent mode (Session will be saved)\n")}` +
        {
            padding: 1,
            margin: { bottom: 1 },
            borderStyle: "round",
            borderColor: "cyan",
            title: "Agent Instructions",
        }
    );
    console.log(helpBox);

    while (true) {
        const userInput = await text({
            message: chalk.magenta("What would you like to build? "),
            placeholder: "e.g. Build a todo app with react and tailwindcss",
            initialValue: "",
            validate: (value) => {
                if (!value || value.trim().length === 0) {
                    return "Description cannot be empty";
                }
                if (value.trim().length < 10) {
                    return "Please provide more details(At least 10 characters)";
                }
            },
        });

        if (isCancel(userInput)) {
            cancel(chalk.yellow("Agent session is cancelled.\n"));
            process.exit(0);
        }

        if (userInput.trim().toLowerCase() === "exit") {
            cancel(chalk.yellow("Agent session is ended.\n"));
            break;
        }
        const userBox = boxen(
            `${chalk.bold("User")}: ${userInput}\n` +
            {
                padding: 1,
                margin: { top: 1, bottom: 1 },
                borderStyle: "round",
                borderColor: "blue",
                title: "Your Request",
                titleAlignment: "left",
            }
        );
        console.log(userBox);

        await saveMessage(conversation.id, "user", userInput);

        try {
            const result = await generateApplication(
                userInput,
                conversation.id,
                process.cwd()
            );
            if (result && result.success) {
                const responseMessage = `Generated application ${result.folderName}` +
                    `File Created: ${result.files.length}\n` +
                    `Location: ${result.appDir}\n\n` +
                    `Setup commands: ${result.setupCommands.join('\n')}`;
                console.log(responseMessage);
                await saveMessage(conversation.id, "assistant", responseMessage);
            }
            await saveMessage(conversation.id, "assistant", responseMessage);

            const continuePrompt = await confirm({
                message: chalk.yellow("Would you like to generate another application?"),
                initialValue: false,
            });
            if (isCancel(continuePrompt) || !continuePrompt) {
                cancel(chalk.yellow("Great! Check your new application. \n"));
                break;
            } else {
                throw new Error("Generation returned no result");
            }
        } catch (error) {
            console.log(chalk.red(`Error: ${error.message}\n`));

            await saveMessage(conversation.id, "assistant", `Error: ${error.message}`);

            const retry = await confirm({
                message: chalk.yellow("Would you like to try again?"),
                initialValue: true,
            });

            if (isCancel(retry) || !retry) {
                break;
            } else {
                throw new Error("Generation returned no result");
            }
        }

    }
}

export async function startAgentChat(conversationId = null) {
    try {
        intro(
            boxen(
                chalk.bold.cyan("Agentix - Agent Mode"),
                {
                    padding: 1,
                    margin: { top: 1, bottom: 1 },
                    borderStyle: "double",
                    borderColor: "cyan",
                    title: "Agentix - Agent Mode",
                    titleAlignment: "center",
                }
            )
        );

        const user = await getUserFromToken();
        const shouldContinue = await confirm({
            message: chalk.yellow("The agent will work in the current directory: " + process.cwd() + "\nDo you want to continue?"),
            initialValue: true,
        });
        if (isCancel(shouldContinue) || !shouldContinue) {
            cancel(chalk.yellow("Agent Mode cancelled"));
            process.exit(0);
        }

        const conversation = await initConversation(user.id, conversationId);
        await agentLoop(conversation);

        outro(chalk.green.bold("Thank you for using Agent Mode!"));
    } catch (error) {
        const errorBox = boxen(chalk.red(`Error: ${error.message}`),
            {
                padding: 1,
                margin: { top: 1, bottom: 1 },
                borderStyle: "round",
                borderColor: "red",
            }
        );
        console.error(errorBox);
        process.exit(1);
    }
}
