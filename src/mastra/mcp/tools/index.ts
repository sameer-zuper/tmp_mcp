/**
 * Zuper FSM MCP Tools
 *
 * Organized by functional area for better maintainability
 */

import { makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL } from "./common";
import { createJobTools } from "./jobs";
import { createUserTools } from "./users";
import { createTeamTools } from "./teams";
import { createCustomerTools } from "./customers";
import { createInvoiceTools } from "./invoices";
import { createPropertyTools } from "./properties";
import { createTimesheetTools } from "./timesheets";
import { createTimeOffTools } from "./timeoff";
import { createAssetTools } from "./assets";
import { createPartTools } from "./parts";
import { createServiceContractTools } from "./contracts";
import { createQuoteTools } from "./quotes";

// Export all tools organized by category
export function getAllTools() {
  const jobTools = createJobTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const userTools = createUserTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const teamTools = createTeamTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const customerTools = createCustomerTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const invoiceTools = createInvoiceTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const propertyTools = createPropertyTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const timesheetTools = createTimesheetTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const timeOffTools = createTimeOffTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const assetTools = createAssetTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const partTools = createPartTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const contractTools = createServiceContractTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  const quoteTools = createQuoteTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);

  return {
    // Job Management Tools (7 tools)
    ...jobTools,

    // User Management Tools (4 tools)
    ...userTools,

    // Team Management Tools (2 tools)
    ...teamTools,

    // Customer Management Tools (3 tools)
    ...customerTools,

    // Invoice Management Tools (3 tools)
    ...invoiceTools,

    // Property Management Tools (2 tools)
    ...propertyTools,

    // Timesheet Tools (2 tools)
    ...timesheetTools,

    // Time-off Management Tools (2 tools)
    ...timeOffTools,

    // Asset Management Tools (3 tools)
    ...assetTools,

    // Parts & Inventory Tools (3 tools)
    ...partTools,

    // Service Contract Tools (3 tools)
    ...contractTools,

    // Quote Management Tools (3 tools)
    ...quoteTools,
  };
}
