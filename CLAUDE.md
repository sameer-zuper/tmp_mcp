# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Zuper FSM MCP Server** - a Model Context Protocol server that exposes Zuper Field Service Management APIs as MCP tools. Built with Mastra framework, it provides 44 tools across 11 categories and includes an intelligent dispatcher agent.

**Key Technologies:**
- Mastra (AI agent framework)
- TypeScript with ES2022 modules
- Zod for schema validation
- Model Context Protocol (MCP)
- OpenAI for agent reasoning

## Development Commands

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

**Note:** There are no tests currently configured. The test script exits with an error.

## Architecture

### Directory Structure

```
MCP_Server/src/mastra/
├── index.ts                    # Mastra instance configuration (storage, logger)
├── agents/
│   └── dispatcher.ts           # Intelligent job assignment agent
└── mcp/
    ├── server.ts              # MCP server definition (imports tools from tools/)
    ├── resources.ts           # MCP resources (job templates, user profiles, etc.)
    ├── prompts.ts             # 13 pre-built prompts for FSM operations
    └── tools/                 # 45 MCP tools organized by category
        ├── common.ts          # Shared utilities (makeZuperRequest, schemas)
        ├── index.ts           # Aggregates and exports all tools
        ├── mastra-adapter.ts  # Adapter to convert MCP tools → Mastra agent format
        ├── jobs.ts            # 7 job management tools
        ├── users.ts           # 4 user management tools (includes getUserTeams)
        ├── teams.ts           # 2 team management tools
        ├── customers.ts       # 3 customer tools
        ├── invoices.ts        # 3 invoice tools
        ├── properties.ts      # 2 property tools
        ├── timesheets.ts      # 2 timesheet tools
        ├── timeoff.ts         # 2 time-off tools
        ├── assets.ts          # 3 asset tools
        ├── parts.ts           # 3 parts/inventory tools
        ├── contracts.ts       # 3 service contract tools
        └── quotes.ts          # 3 quote/estimate tools
```

### Tool Architecture

**Single Source of Truth:** All tools are defined in `src/mastra/mcp/tools/` using MCP format.

1. **MCP Tools** (`src/mastra/mcp/tools/*.ts`) - Core tool definitions
   - 45 tools across 11 modular files
   - Each tool accepts `apiKey` and `baseUrl` for multi-tenant support
   - Used by MCP server to expose tools to external clients

2. **Mastra Adapter** (`src/mastra/mcp/tools/mastra-adapter.ts`) - Converts MCP → Mastra format
   - Transforms MCP tools into Mastra agent-compatible tools
   - Dispatcher agent uses this adapter to access the same tools
   - Eliminates duplication - single source of truth for all tools

### Modular Tool Pattern

Each tool module follows this pattern:

```typescript
import { z } from "zod";

export function createXxxTools(
  makeZuperRequest: Function,
  apiCredentialsSchema: z.ZodObject<any>,
  DEFAULT_ZUPER_API_KEY: string,
  DEFAULT_ZUPER_BASE_URL: string
) {
  return {
    toolName: {
      description: "...",
      parameters: apiCredentialsSchema.extend({
        // tool-specific parameters
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...rest } = params;
        const result = await makeZuperRequest("/api/endpoint", apiKey, baseUrl, "GET");
        return { status: "success", data: result };
      },
    },
  };
}
```

### Multi-Tenant Architecture

**All tools support per-tenant credentials:**
- Each tool accepts optional `apiKey` and `baseUrl` parameters
- Falls back to environment variables if not provided
- Enables SaaS multi-tenancy with data isolation
- NEVER hardcode credentials - always use parameters or env vars

### Dispatcher Agent

Located at `src/mastra/agents/dispatcher.ts`:

**Purpose:** Automatically assigns jobs to best-matched technicians

**Process:**
1. Uses `assistedScheduling` tool for AI-powered recommendations (preferred)
2. Falls back to manual matching: skills, availability, time-off, workload
3. Scores candidates and selects optimal technician
4. Assigns job and returns reasoning

**Usage:**
```typescript
import { dispatcherAgent } from './mastra/agents/dispatcher';

const result = await dispatcherAgent.generate([{
  role: 'user',
  content: JSON.stringify({ jobUid: 'job_123', apiKey, baseUrl })
}]);
```

## Important Patterns

### Adding New MCP Tools

1. Create new file in `src/mastra/mcp/tools/` (e.g., `scheduling.ts`)
2. Export factory function following the pattern above
3. Import in `src/mastra/mcp/tools/index.ts`
4. Add to `getAllTools()` return object with descriptive comment

### API Request Pattern

All Zuper API calls use `makeZuperRequest()` from `common.ts`:

```typescript
const result = await makeZuperRequest(
  "/api/endpoint",    // Zuper API endpoint
  apiKey,             // Per-tenant API key
  baseUrl,            // Zuper region base URL
  "POST",             // HTTP method (optional, defaults to GET)
  { data }            // Request body (optional)
);
```

### Error Handling

Tools return structured responses:
```typescript
{
  status: "success",
  data: result,
  message: "Operation completed" // optional
}
```

Errors are thrown and handled by Mastra framework.

## Environment Variables

```bash
# Required for agents
OPENAI_API_KEY=your_openai_key

# Optional fallback credentials for development
ZUPER_API_KEY=your_zuper_api_key
ZUPER_BASE_URL=https://your-region.zuperpro.com
```

**Production:** Credentials should be passed per-request, not via environment variables.

## Key Files to Understand

1. **`src/mastra/index.ts`** - Mastra configuration (storage, logging)
2. **`src/mastra/mcp/server.ts`** - MCP server setup (simple after modularization)
3. **`src/mastra/mcp/tools/index.ts`** - Central tool aggregator
4. **`src/mastra/mcp/tools/common.ts`** - Shared API utilities and schemas
5. **`src/mastra/mcp/tools/mastra-adapter.ts`** - Adapter converting MCP tools → Mastra format
6. **`src/mastra/agents/dispatcher.ts`** - Job assignment logic (uses adapter)
7. **`src/mastra/mcp/prompts.ts`** - Pre-built prompts for common operations

## Known Issues / TODO

1. **No Tests:** Test infrastructure needs to be set up

2. **Documentation:** README.md references USAGE.md, TOOLS_REFERENCE.md, AGENTS.md, PROMPTS.md but these files don't exist

## Design Decisions

### Why Modular Tools Structure?

Previously all 44 tools were in a single `server.ts` file (800+ lines). Migrated to modular structure for:
- Maintainability: Each category ~200-300 lines
- Testability: Individual modules can be tested
- Reusability: Tools can be imported separately
- Clarity: Organized by functional domain

### Why Multi-Tenant at Tool Level?

Each tool accepts `apiKey`/`baseUrl` parameters rather than server-level configuration because:
- Supports SaaS use cases with multiple Zuper accounts
- Enables per-user/per-organization data isolation
- Allows dynamic credential management
- Backend can proxy with appropriate credentials

### Why Use an Adapter for Mastra Agents?

The adapter pattern (`mastra-adapter.ts`) allows:
- **Single source of truth:** All tools defined once in MCP format
- **Format conversion:** Translates MCP tool format → Mastra agent tool format
- **No duplication:** Agents use the same 45 tools that MCP server exposes
- **Maintainability:** Changes to tools automatically propagate to both MCP server and agents
- **Flexibility:** Easy to add new tools without modifying agent code
