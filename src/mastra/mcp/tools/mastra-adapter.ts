/**
 * Adapter to convert MCP tools to Mastra agent-compatible format
 *
 * This allows agents to use the same MCP tools that the server exposes,
 * eliminating duplication and maintaining a single source of truth.
 */

import { createTool } from "@mastra/core";
import { getAllTools } from "./index";

/**
 * Converts MCP tool format to Mastra agent tool format
 */
function convertMcpToolToMastraTool(toolName: string, mcpTool: any) {
  return createTool({
    id: toolName,
    description: mcpTool.description,
    inputSchema: mcpTool.parameters,
    execute: async (params: any) => {
      const { context } = params || {};

      // Call the MCP tool's execute function with the proper format
      const result = await mcpTool.execute({
        context,
        runId: `agent-${Date.now()}`,
        params: context || {},
      });

      return result;
    },
  });
}

/**
 * Get all MCP tools converted to Mastra agent format
 *
 * This provides a subset of tools commonly used by agents.
 * Add more tools here as agents need them.
 */
export function getMastraToolsFromMcp() {
  const allMcpTools = getAllTools();

  // Convert the tools that agents need
  return {
    // Job Management
    getJob: convertMcpToolToMastraTool("getJob", allMcpTools.getJob),
    listJobs: convertMcpToolToMastraTool("listJobs", allMcpTools.listJobs),
    updateJob: convertMcpToolToMastraTool("updateJob", allMcpTools.updateJob),
    assignJob: convertMcpToolToMastraTool("assignJob", allMcpTools.assignJob),
    unassignJob: convertMcpToolToMastraTool("unassignJob", allMcpTools.unassignJob),
    assistedScheduling: convertMcpToolToMastraTool("assistedScheduling", allMcpTools.assistedScheduling),

    // User Management
    listUsers: convertMcpToolToMastraTool("listUsers", allMcpTools.listUsers),
    getUser: convertMcpToolToMastraTool("getUser", allMcpTools.getUser),
    getUserSkills: convertMcpToolToMastraTool("getUserSkills", allMcpTools.getUserSkills),
    getUserTeams: convertMcpToolToMastraTool("getUserTeams", allMcpTools.getUserTeams),

    // Team Management
    listTeams: convertMcpToolToMastraTool("listTeams", allMcpTools.listTeams),
    getTeam: convertMcpToolToMastraTool("getTeam", allMcpTools.getTeam),

    // Time-off Management
    listTimeOffRequests: convertMcpToolToMastraTool("listTimeOffRequests", allMcpTools.listTimeOffRequests),
    checkTimeOffAvailability: convertMcpToolToMastraTool("checkTimeOffAvailability", allMcpTools.checkTimeOffAvailability),
  };
}
