import e from "express";
import { CONFIG_DIR, TOKEN_FILE } from "../cli/commands/auth/login.js";

export async function getStoredToken() {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    const token = JSON.parse(data);
    return token;
  } catch (error) {
    return null;
  }
}

export async function storeToken(token) {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type || "Bearer",
      scope: token.scope,
      expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000)
        : null,
      created_at: new Date().toISOString(),
    };
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(chalk.red("Error storing token:"), error.message);
  }
}

export async function clearStoredToken() {
  try {
    await fs.unlink(TOKEN_FILE);
    return true;
  } catch (error) {
    // Ignore error if file does not exist
    return false;
  }
}

export async function isTokenExpired(token) {
  const token = await getStoredToken();
  if (!token || !token.expires_at) {
    return true;
  }
  const expiresAt = new Date(token.expires_at);
  const now = new Date();

  return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000; // 5 minutes buffer
}

export async function requireAuth() {
    const token = await getStoredToken();
    if (!token) {
      console.log(chalk.red("Not authenticated. Please run 'your-cli login' first."));
      process.exit(1);
    }
    if (await isTokenExpired(token)) {
     console.log(chalk.red("Your token has expired. Please login again."));
     console.log(chalk.gray("  Run: your-cli login\n"));
     process.exit(1);
    }
    return token;
}