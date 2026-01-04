import { google } from "@ai-sdk/google";
import chalk from "chalk";

export const availableTools = [
  {
    id: "google_search",
    name: "Google Search",
    description: "Access the latest information from Google search results.",
    getTool: () => google.tools.googleSearch({}),
    enabled: false,
  },
  {
    id: "code_execution",
    name: "Code Execution",
    description:
      "Execute JavaScript/TypeScript code in a sandboxed environment.",
    getTool: () => google.tools.codeExecution({}),
    enabled: true,
  },
  {
    id: "url_context",
    name: "URL Context",
    description: "Fetch and summarize content from a given URL.",
    getTool: () => google.tools.urlContext({}),
    enabled: false,
  },
];

export function getEnabledTools() {
  const tools = {};

  try {
    for (const toolConfig of availableTools) {
      if (toolConfig.enabled) {
        tools[toolConfig.id] = toolConfig.getTool();
      }
    }

    if (Object.keys(tools).length > 0) {
      console.log(
        chalk.gray(`[DEBUG] Tools enabled: ${Object.keys(tools).join(", ")}`)
      );
    } else {
      console.log(chalk.yellow(`[DEBUG] No tools enabled`));
    }

    return Object.keys(tools).length > 0 ? tools : undefined;
  } catch (error) {
    console.error(
      chalk.red("[ERROR] Failed to initialize tools:"),
      error.message
    );
    console.error(
      chalk.yellow("Make sure you have @ai-sdk/google version 2.0+ installed")
    );
    console.error(chalk.yellow("Run: npm install @ai-sdk/google@latest"));
    return undefined;
  }
}

export function toggleTool(toolId) {
  const tool = availableTools.find((t) => t.id === toolId);

  if (tool) {
    tool.enabled = !tool.enabled;
    console.log(
      chalk.gray(`[DEBUG] Tools ${toolId} toggled to ${tool.enabled}`)
    );

    return tool.enabled;
  }
  console.log(chalk.red(`[DEBUG] Tool ${toolId} not found`));

  return false;
}

export function enableTools(toolIds) {
  console.log(chalk.gray("[DEBUG] enableTools called with:"), toolIds);

  availableTools.forEach((tool) => {
    const wasEnabled = tool.enabled;
    tool.enabled = toolIds.includes(tool.id);

    if (tool.enabled !== wasEnabled) {
      console.log(
        chalk.gray(`[DEBUG] ${tool.id}: ${wasEnabled} → ${tool.enabled}`)
      );
    }
  });

  const enabledCount = availableTools.filter((t) => t.enabled).length;
  console.log(
    chalk.gray(
      `[DEBUG] Total tools enabled: ${enabledCount}/${availableTools.length}`
    )
  );
}

export function getEnabledToolNames() {
  const names = availableTools.filter((t) => t.enabled).map((t) => t.name);

  console.log(chalk.gray("[DEBUG] getEnabledToolNames returning:"), names);

  return names;
}

export function resetTools() {
  console.log(chalk.gray("[DEBUG] resetTools called"));
  availableTools.forEach((tool) => {
    if (tool.enabled) {
      console.log(chalk.gray(`[DEBUG] ${tool.id}: true → false`));
    }
    tool.enabled = false;
  });

  console.log(
    chalk.gray(`[DEBUG] All tools reset (0/${availableTools.length} enabled)`)
  );
}
