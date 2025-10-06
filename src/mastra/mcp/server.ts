import { MCPServer } from "@mastra/mcp";
import { mastra } from "../index";
import { resources } from "./resources";
import { prompts } from "./prompts";
import { getAllTools } from "./tools";

// Get all tools from modular structure
const allTools = getAllTools();

export const mcp = new MCPServer({
  name: "zuper-fsm-server",
  version: "0.1.0",
  mastra,
  resources,
  prompts,
  tools: allTools,
});
