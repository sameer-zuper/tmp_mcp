import { MCPServer } from "@mastra/mcp";
import { resources } from "./resources";
import { prompts } from "./prompts";
import { getAllTools } from "./tools";

// Get all tools from modular structure
const allTools = getAllTools();

export const zuper_mcp = new MCPServer({
  name: "zuper-fsm-server",
  version: "0.1.0",
  description: "Zuper Field Service Management MCP Server with 45 tools, resources, and smart prompts",
  tools: allTools,
  resources,
  prompts,
});
