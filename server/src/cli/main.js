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
import gradient from "gradient-string";
dotenv.config();

async function main() {

  const asciiArt = figlet.textSync("Agentix", {
    font: "ANSI Shadow",
    horizontalLayout: "full",
    verticalLayout: "full"
  });
  console.log("\n\n");

  console.log(
    gradient(["#2c4fb8", "#2bb673", "#f2c94c"])(asciiArt)
  );
  console.log(chalk.yellowBright("Welcome to the Agentix CLI!\n"));

  const loginCommand = new Command("login")
    .description("Login to the Agentix CLI")
    .action(() => loginAction());

  const logoutCommand = new Command("logout")
    .description("Logout from the Agentix CLI")
    .action(() => logoutAction());

  const whoamiCommand = new Command("whoami")
    .description("Display information about the currently logged-in user")
    .action(() => whoamiAction());

  const wakeUp = new Command("wakeup")
    .description("Wake Up the AI")
    .action(wakeUpAction);

  const program = new Command("agentix");
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
