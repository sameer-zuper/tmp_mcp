import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { dispatcherAgent } from "./agents/dispatcher";
import { zuper_mcp } from "./mcp/server";

// Runtime context interface for Zuper credentials
export interface ZuperRuntimeContext {
  apiKey: string;
  baseUrl: string;
  userId?: string;
  tenantId?: string;
  organizationId?: string;
}

export const mastra: Mastra = new Mastra({
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  agents: {
    dispatcherAgent
  },
  mcpServers: {
    zuper_mcp
  }
});