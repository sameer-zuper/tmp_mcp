# Zuper FSM MCP Tools

This directory contains the modular tool definitions for the Zuper FSM MCP Server.

## Structure

```
tools/
├── README.md           # This file
├── common.ts           # Shared utilities (makeZuperRequest, apiCredentialsSchema, constants)
├── index.ts            # Main entry point that exports all tools
├── jobs.ts             # Job management tools (6 tools) ✅ MIGRATED
└── [future files]      # Other categories to be added
```

## Migrated Tools

### ✅ Job Management (`jobs.ts`)
- `createJob` - Create a new job/work order
- `getJob` - Retrieve job details by UID
- `listJobs` - List all jobs with filtering
- `updateJob` - Update existing job
- `assignJob` - Assign technicians/teams to job
- `unassignJob` - Unassign technicians/teams from job

## To Be Migrated

The following tool categories are still in `server.ts` and need to be migrated:

### Customer Management (3 tools)
- `createCustomer`
- `getCustomer`
- `listCustomers`

### Invoice Management (3 tools)
- `createInvoice`
- `getInvoice`
- `listInvoices`

### Property Management (2 tools)
- `createProperty`
- `getProperty`

### User Management (3 tools)
- `getUser`
- `listUsers`
- `getUserSkills`

### Team Management (2 tools)
- `getTeam`
- `listTeams`

### Timesheet Tools (2 tools)
- `listTimesheets`
- `getTimesheetSummary`

### Time-off Management (2 tools)
- `listTimeOffRequests`
- `checkTimeOffAvailability`

### Asset Management (3 tools)
- `createAsset`
- `getAsset`
- `listAssets`

### Parts & Inventory (3 tools)
- `createPart`
- `getPart`
- `listParts`

### Service Contract Tools (3 tools)
- `createServiceContract`
- `getServiceContract`
- `listServiceContracts`

### Quote Management (3 tools)
- `createQuote`
- `getQuote`
- `listQuotes`

## How to Add New Tools

1. Create a new file in this directory (e.g., `customers.ts`)
2. Export a function that creates and returns the tools:
   ```typescript
   import { z } from "zod";

   export function createCustomerTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL) {
     return {
       createCustomer: {
         description: "...",
         parameters: apiCredentialsSchema.extend({ ... }),
         execute: async ({ context, runId, params }) => { ... }
       },
       // ... more tools
     };
   }
   ```
3. Import and add to `index.ts`:
   ```typescript
   import { createCustomerTools } from "./customers";

   const customerTools = createCustomerTools(...);

   return {
     ...jobTools,
     ...customerTools,
     // ... more
   };
   ```

## Benefits

- **Maintainability**: Each category is in its own file (~200-300 lines)
- **Testability**: Easy to test individual tool categories
- **Reusability**: Tools can be imported and used separately
- **Clarity**: Clear organization by functional area
- **Scalability**: Easy to add new tools without bloating server.ts

## Usage

In `server.ts`:
```typescript
import { getAllTools } from "./tools";

const allTools = getAllTools();

export const mcp = new MCPServer({
  // ...
  tools: allTools,
});
```
