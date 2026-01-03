#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import {
  loginAction,
  logoutAction,
  whoamiAction,
} from "./commands/auth/login.js";
import { wakeUpAction } from "./commands/ai/wakeUp.js";

dotenv.config();

async function main() {
  console.log(
    chalk.bold.red(
      figlet.textSync("AI Agent CLI", {
        font: "Standard",

        horizontalLayout: "default",
      })
    )
  );
  console.log(chalk.yellowBright("Welcome to the AI Agent CLI!\n"));

  const loginCommand = new Command("login")
    .description("Login to the AI Agent CLI")
    .action(() => loginAction());

  const logoutCommand = new Command("logout")
    .description("Logout from the AI Agent CLI")
    .action(() => logoutAction());

  const whoamiCommand = new Command("whoami")
    .description("Display information about the currently logged-in user")
    .action(() => whoamiAction());

  const wakeUp = new Command("wakeup")
    .description("Wake Up the AI")
    .action(wakeUpAction);

  const program = new Command("cli-ai-tool");
  program
    .version("1.0.0")
    .description("CLI based AI Tool")
    .addCommand(loginCommand)
    .addCommand(logoutCommand)
    .addCommand(whoamiCommand)
    .addCommand(wakeUp)

  program.action(() => {
    program.help();
  });

  program.parse();
}
main().catch((error) => {
  console.error(chalk.red("An unexpected error occurred:"), error);
  process.exit(1);
});
