/**
 * Zuper FSM MCP Tools
 *
 * Organized by functional area for better maintainability
 */

import { makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL } from "./common";
import { createJobTools } from "./jobs";

// Export all tools organized by category
export function getAllTools() {
  const jobTools = createJobTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);

  return {
    // Job Management Tools
    ...jobTools,

    // TODO: Add other categories as they are migrated
    // Customer Management Tools
    // Invoice Management Tools
    // Property Management Tools
    // User Management Tools
    // Team Management Tools
    // Timesheet Tools
    // Time-off Management Tools
    // Asset Management Tools
    // Parts & Inventory Tools
    // Service Contract Tools
    // Quote Management Tools
  };
}
