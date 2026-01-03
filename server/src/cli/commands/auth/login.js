import { cancel, confirm, intro, isCancel, outro } from "@clack/prompts";
import { createAuthClient } from "better-auth/client";
import { Command } from "commander";

import chalk from "chalk";
import fs from "node:fs/promises";
import open from "open";
import os from "os";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import * as z from "zod";
import dotenv from "dotenv";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import { fileURLToPath } from "url";
import  prisma  from "../../../lib/db.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "../../../../.env");

dotenv.config({ path: envPath });

const URL = "http://localhost:3001";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;

export const CONFIG_DIR = path.join(os.homedir(), ".ai-agent-cli");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction(opts = {}) {
  const options = z
    .object({
      serverUrl: z.string().url().optional(),
      clientId: z.string().optional(),
    })
    .parse(opts);

  const serverUrl = options.serverUrl || URL;
  const clientId = options.clientId || CLIENT_ID;

  if (!clientId) {
    console.error(chalk.bgRed.white(" CLIENT_ID is not set "));
    process.exit(1);
  }

  intro(chalk.bold.cyanBright("AI Agent CLI Login"));

  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

  if (existingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already logged in. Login again?",
      initialValue: false,
    });

    if (isCancel(shouldReAuth) || !shouldReAuth) {
      cancel(chalk.yellow("Login cancelled."));
      process.exit(0);
    }
  }

  const authClient = createAuthClient({
    baseUrl: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  const spinner = yoctoSpinner({
    text: chalk.gray("Requesting device authorization..."),
  });
  spinner.start();

  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });

    spinner.stop();

    if (error || !data) {
      console.error(
        chalk.redBright("Device authorization failed:"),
        error?.error_description || error?.error || "Unknown error"
      );
      process.exit(1);
    }

    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      interval = 5,
      expires_in,
    } = data;

    console.log(chalk.greenBright("Device authorization created\n"));
    console.log(
      chalk.yellowBright("Visit:"),
      chalk.underline.blueBright(verification_uri_complete || verification_uri)
    );
    console.log(
      chalk.magentaBright("Enter code:"),
      chalk.bold.green(user_code)
    );

    const shouldOpen = await confirm({
      message: "Open the URL in your browser?",
      initialValue: true,
    });

    if (!isCancel(shouldOpen) && shouldOpen) {
      await open(verification_uri_complete || verification_uri);
    }

    console.log(
      chalk.gray(
        `\nWaiting for authorization (${Math.floor(
          expires_in / 60
        )} minutes)...`
      )
    );

    const token = await pollForToken(
      authClient,
      device_code,
      clientId,
      interval
    );

    if (token) {

      const saved = await storeToken(token);
        if (!saved) {
        console.log(chalk.redBright("Failed to save the token."));
        console.log(chalk.redBright("You may need to login again or next use."));
        
      }
      const userData = await getUserData(authClient, token);
      if (userData) {
        console.log(
          chalk.greenBright(`\nWelcome, ${userData.name || userData.email}!`)
        );
      }

      outro(chalk.bold.green("Login successful!"));
      console.log(chalk.gray(`Token saved at ${TOKEN_FILE}\n`));
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.redBright("Login failed:"), error.message);
    process.exit(1);
  }
}

export async function getStoredToken() {
  try {
    await fs.access(TOKEN_FILE);
    return JSON.parse(await fs.readFile(TOKEN_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export async function isTokenExpired() {
  const token = await getStoredToken();
  return !token?.expires_at || Date.now() >= token.expires_at * 1000;
}

export async function storeToken(tokenData) {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    await fs.writeFile(
      TOKEN_FILE,
      JSON.stringify(
        {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at:
            Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
          token_type: tokenData.token_type,
        },
        null,
        2
      )
    );
    return true;
  } catch (err) {
    console.error(chalk.red("Token save failed:"), err);
    return false;
  }
}

export async function getUserData(authClient, token) {
  try {
    const { data, error } = await authClient.getUser({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      },
    });

    if (error?.status === 404) {
      console.log(
        chalk.gray("User endpoint not available – skipping user info.")
      );
      return null;
    }

    if (error) {
      console.error(chalk.red("User fetch error:"), error);
      return null;
    }

    return data;
  } catch (err) {
    console.error(chalk.red("User fetch failed:"), err);
    return null;
  }
}

export async function pollForToken(
  authClient,
  deviceCode,
  clientId,
  initialInterval
) {
  let pollingInterval = initialInterval;
  const spinner = yoctoSpinner({
    text: chalk.gray("Waiting for authorization"),
  });

  return new Promise((resolve, reject) => {
    const poll = async () => {
      spinner.start();

      try {
        const { data, error } = await authClient.device.token({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: deviceCode,
          client_id: clientId,
        });

        if (data?.access_token) {
          spinner.stop();
          console.log(
            chalk.greenBright(
              `Authorization completed! Access token ${data.access_token}.\n`
            )
          );
          resolve(data);
        } else if (error?.error === "authorization_pending") {
          setTimeout(poll, pollingInterval * 1000);
        } else if (error?.error === "slow_down") {
          pollingInterval += 5;
          setTimeout(poll, pollingInterval * 1000);
        } else {
          spinner.stop();
          reject(error);
        }
      } catch (err) {
        spinner.stop();
        reject(err);
      }
    };

    setTimeout(poll, pollingInterval * 1000);
  });
}

export async function logoutAction() {
  intro(chalk.bold.cyanBright("Logout"));

  const token = await getStoredToken();
  if (!token) {
    console.log(chalk.yellow("Not logged in."));
    return;
  }

  const shouldLogout = await confirm({
    message: "Are you sure you want to logout?",
    initialValue: false,
  });

  if (isCancel(shouldLogout) || !shouldLogout) {
    cancel(chalk.gray("Logout cancelled."));
    return;
  }

  await fs.rm(TOKEN_FILE, { force: true });
  outro(chalk.greenBright("Logged out successfully."));
}

export async function requireAuth() {
  const token = await getStoredToken();

  if (!token) {
    return null;
  }

  const expired = await isTokenExpired();
  if (expired) {
    return null;
  }

  return token;
}

export async function whoamiAction(opts) {
  const token = await requireAuth();

  if (!token?.access_token) {
    console.log(chalk.yellowBright("You are not logged in."));
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: {
          token: token.access_token,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (!user) {
    console.log(chalk.redBright("Unable to resolve user from session token."));
    process.exit(1);
  }

  console.log(
    chalk.gray(
      `\nLogged in as:\n` +
        `${chalk.bold.red("Name:")} ${user.name}\n` +
        `${chalk.bold.red("Email:")} ${user.email}\n` +
        `${chalk.bold.red("ID:")} ${user.id}\n`
    )
  );
}

export const login = new Command("login")
  .description("Login to AI Agent CLI")
  .option("--client-id <id>")
  .option("--server-url <url>")
  .action(loginAction);

export const logout = new Command("logout")
  .description("Logout and clear stored authentication token")
  .action(logoutAction);
export const whoami = new Command("whoami")
  .description("Display information about the currently logged-in user")
  .option("--server-url <url>", "Better Auth server URL", URL)
  .action(whoamiAction);
