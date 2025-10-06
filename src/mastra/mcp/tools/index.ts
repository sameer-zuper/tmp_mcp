/**
 * Zuper FSM MCP Tools
 *
 * Organized by functional area for better maintainability
 */

import { createJobTools } from "./jobs";
// TODO: Update other tool files to use the new context-aware pattern
// import { createUserTools } from "./users";
// import { createTeamTools } from "./teams";
// import { createCustomerTools } from "./customers";
// import { createInvoiceTools } from "./invoices";
// import { createPropertyTools } from "./properties";
// import { createTimesheetTools } from "./timesheets";
// import { createTimeOffTools } from "./timeoff";
// import { createAssetTools } from "./assets";
// import { createPartTools } from "./parts";
// import { createServiceContractTools } from "./contracts";
// import { createQuoteTools } from "./quotes";

// Export all tools organized by category
export function getAllTools() {
  const jobTools = createJobTools();
  // TODO: Update these to use the new pattern without parameters
  // const userTools = createUserTools();
  // const teamTools = createTeamTools();
  // const customerTools = createCustomerTools();
  // const invoiceTools = createInvoiceTools();
  // const propertyTools = createPropertyTools();
  // const timesheetTools = createTimesheetTools();
  // const timeOffTools = createTimeOffTools();
  // const assetTools = createAssetTools();
  // const partTools = createPartTools();
  // const contractTools = createServiceContractTools();
  // const quoteTools = createQuoteTools();

  return {
    // Job Management Tools (6 tools) - Updated to use runtime context
    ...jobTools,

    // TODO: Migrate remaining tools to use runtime context
    // User Management Tools (4 tools)
    // ...userTools,

    // Team Management Tools (2 tools)
    // ...teamTools,

    // Customer Management Tools (3 tools)
    // ...customerTools,

    // Invoice Management Tools (3 tools)
    // ...invoiceTools,

    // Property Management Tools (2 tools)
    // ...propertyTools,

    // Timesheet Tools (2 tools)
    // ...timesheetTools,

    // Time-off Management Tools (2 tools)
    // ...timeOffTools,

    // Asset Management Tools (3 tools)
    // ...assetTools,

    // Parts & Inventory Tools (3 tools)
    // ...partTools,

    // Service Contract Tools (3 tools)
    // ...contractTools,

    // Quote Management Tools (3 tools)
    // ...quoteTools,
  };
}
