#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { loginAction } from "./commands/auth/login.js";

dotenv.config();

async function main() {
  console.log(
    chalk.bold.red(
      figlet.textSync("Better Auth CLI", {
        font: "Standard",
        
        horizontalLayout: "default",
      })
    )
  );
  console.log(chalk.yellowBright("Welcome to the Better Auth CLI!\n"));

  const loginCommand = new Command("login")
    .description("Login to the AI Agent CLI")
    .action(() => loginAction());

  const program = new Command("cli-ai-tool");
  program.version("1.0.0").description("CLI based AI Tool").addCommand(loginCommand);

    program.action(() => {
        program.help();
    });

    program.parse();
}
main().catch((error) => {
  console.error(chalk.red("An unexpected error occurred:"), error);
  process.exit(1);
});