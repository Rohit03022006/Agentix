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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "../../../../.env");

dotenv.config({ path: envPath });

const URL = "http://localhost:3001";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction(opts = {}) {
    // Validate options
    const options = z.object({
        serverUrl: z.string().url().optional(),
        clientId: z.string().optional(),
    }).parse(opts);

    const serverUrl = options.serverUrl || URL;
    const clientId = options.clientId || CLIENT_ID;

    if (!clientId) {
        console.error(chalk.red("CLIENT_ID is not set in environment variables"));
        process.exit(1);
    }

    intro(chalk.bold("Better Auth CLI Login"));

    // Check existing token
    const existingToken = await getStoredToken();
    const expired = await isTokenExpired();

    if (existingToken && !expired) {
        const shouldReAuth = await confirm({
            message: "You are already logged in. Do you want to login again?",
            initialValue: false,
        });

        if (isCancel(shouldReAuth) || !shouldReAuth) {
            cancel(chalk.red("Login cancelled."));
            process.exit(0);
        }
    }

    const authClient = createAuthClient({
        baseUrl: serverUrl,
        plugins: [deviceAuthorizationClient()],
    });

    const spinner = yoctoSpinner({ text: "Requesting device authorization..." });
    spinner.start();

    try {
        const { data, error } = await authClient.device.code({
            client_id: clientId,
            scope: "openid profile email",
        });

        spinner.stop();
        
        if (error || !data) {
            console.error(chalk.red(`Error requesting device authorization: ${error?.error_description || error?.error || "Unknown error"}`));
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

        console.log(chalk.green("Device authorization requested successfully!"));
        console.log("");

        console.log(chalk.yellow(`Please visit the following URL: ${chalk.underline.blue(verification_uri_complete || verification_uri)}`));
        console.log(`Enter the following code: ${chalk.bold.green(user_code)}`);

        const shouldOpen = await confirm({
            message: "Do you want to open the URL in your default browser?",
            initialValue: true,
        });

        if (!isCancel(shouldOpen) && shouldOpen) {
            const urlToOpen = verification_uri_complete || verification_uri;
            await open(urlToOpen);
        }

        console.log("");
        console.log(chalk.gray(`Waiting for authorization (expires in ${Math.floor(expires_in / 60)} minutes)...`));

        const token = await pollForToken(
            authClient,
            device_code,
            clientId,
            interval
        );

        if (token) {
            const saved = await storeToken(token);

            if (!saved) {
                console.log(chalk.yellow("\nWarning: could not save authentication token."));
                console.log(chalk.yellow("You may need to login again on next use."));
            }

            // Get user data
            const userData = await getUserData(authClient, token);
            if (userData) {
                console.log(chalk.green(`\nWelcome, ${userData.name || userData.email}!`));
            }

            outro(chalk.green("Login successful!"));
            console.log(chalk.gray(`\nToken saved to ${TOKEN_FILE}`));
            console.log(chalk.gray("You can now use AI Agent CLI commands without logging in again.\n"));
        }
    } catch (error) {
        spinner.stop();
        console.error(chalk.red("\nLogin failed."), error.message);
        process.exit(1);
    }
}

// Token Management Functions
async function getStoredToken() {
    try {
        try {
            await fs.access(TOKEN_FILE);
        } catch {
            return null;
        }
        
        const tokenData = await fs.readFile(TOKEN_FILE, 'utf-8');
        return JSON.parse(tokenData);
    } catch (error) {
        return null;
    }
}

async function isTokenExpired() {
    const token = await getStoredToken();
    if (!token || !token.expires_at) {
        return true;
    }
    return Date.now() >= token.expires_at * 1000;
}

async function storeToken(tokenData) {
    try {
        try {
            await fs.access(CONFIG_DIR);
        } catch {
            await fs.mkdir(CONFIG_DIR, { recursive: true });
        }
        
        const tokenToStore = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
            token_type: tokenData.token_type,
        };

        await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenToStore, null, 2));
        return true;
    } catch (error) {
        console.error("Error storing token:", error);
        return false;
    }
}

async function getUserData(authClient, token) {
    try {
        const { data: userData, error } = await authClient.getUser({
            fetchOptions: {
                headers: {
                    'Authorization': `Bearer ${token.access_token}`
                }
            }
        });
        
        if (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
        
        return userData;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

async function pollForToken(authClient, deviceCode, clientId, initialInterval) {
    let pollingInterval = initialInterval;
    const spinner = yoctoSpinner({ text: "", color: "red" });
    let dots = 0;
    let attemptCount = 0;

    return new Promise((resolve, reject) => {
        const poll = async () => {
            dots = (dots + 1) % 4;
            spinner.text = chalk.gray(
                `Waiting for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`
            );
            if (!spinner.isSpinning) spinner.start();
            attemptCount++;

            try {
                const { data, error } = await authClient.device.token({
                    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
                    device_code: deviceCode,
                    client_id: clientId,
                });

                if (data?.access_token) {
                    spinner.stop();
                    console.log(chalk.green(" Authorization successful!"));
                    resolve(data);
                } else if (error) {
                    switch (error.error) {
                        case "authorization_pending":
                            setTimeout(poll, pollingInterval * 1000);
                            break;
                        case "slow_down":
                            pollingInterval += 5;
                            setTimeout(poll, pollingInterval * 1000);
                            break;
                        case "expired_token":
                            spinner.stop();
                            console.error(chalk.red("✗ Error: The device code has expired."));
                            reject(new Error("The device code has expired."));
                            break;
                        default:
                            spinner.stop();
                            console.error(
                                chalk.red("An unexpected error occurred:"),
                                error
                            );
                            reject(error);
                    }
                } else {
                    console.error(
                        chalk.yellow("Unexpected response: no data or error")
                    );
                    setTimeout(poll, pollingInterval * 1000);
                }
            } catch (err) {
                spinner.stop();
                console.error(chalk.red("Network error:"), err);
                reject(err);
            }
        };

        setTimeout(poll, pollingInterval * 1000);
    });
}


// Export the login command
export const login = new Command("login")
    .description("Login to Better Auth")
    .option("--client-id <id>", "The Better Auth client ID", CLIENT_ID)
    .option("--server-url <url>", "The Better Auth server URL", URL)
    .action(async (options) => {
        await loginAction(options);
    });