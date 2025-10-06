# Migration Guide: Runtime Context System

This guide explains how to migrate from the old parameter-based credential system to the new runtime context system.

## Overview

The new system uses Mastra's runtime context to pass `apiKey` and `baseUrl` instead of requiring them as parameters for every tool call. This provides:

- **Better UX**: No need to pass credentials with every tool call
- **Multi-tenant Support**: Context can be set per user/tenant
- **Flexibility**: Still supports parameter overrides when needed
- **Security**: Credentials are managed centrally

## Key Changes

### Before (Old System)
```typescript
// Every tool call required apiKey and baseUrl
const result = await mcp.tools.createJob({
  apiKey: userApiKey,
  baseUrl: userBaseUrl,
  customerUid: "customer_123",
  jobTitle: "Repair Service"
});
```

### After (New System)
```typescript
// Set context once
const context = createZuperContext({
  apiKey: userApiKey,
  baseUrl: userBaseUrl,
  userId: "user_123"
});

// Use tools without credentials
const result = await mcp.tools.createJob({
  context: { runtime: context },
  runId: "run_123",
  params: {
    customerUid: "customer_123",
    jobTitle: "Repair Service"
  }
});
```

## Migration Steps

### 1. Update Tool Files

#### Old Pattern (jobs.ts example):
```typescript
export function createJobTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    createJob: {
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...jobData } = params;
        const result = await makeZuperRequest("/api/jobs", apiKey, baseUrl, "POST", jobData);
        // ...
      }
    }
  };
}
```

#### New Pattern:
```typescript
import { makeZuperRequestWithContext, apiCredentialsSchema } from "./common";

export function createJobTools() {
  return {
    createJob: {
      execute: async ({ context, runId, params }: any) => {
        const { apiKey, baseUrl, ...jobData } = params;
        const result = await makeZuperRequestWithContext("/api/jobs", context, { apiKey, baseUrl }, "POST", jobData);
        // ...
      }
    }
  };
}
```

### 2. Update Tool Index

#### Old:
```typescript
export function getAllTools() {
  const jobTools = createJobTools(makeZuperRequest, apiCredentialsSchema, DEFAULT_ZUPER_API_KEY, DEFAULT_ZUPER_BASE_URL);
  // ...
}
```

#### New:
```typescript
export function getAllTools() {
  const jobTools = createJobTools();
  // ...
}
```

### 3. Update Client Code

#### Web Application Example:
```typescript
// Create context from user session
const runtimeContext = createZuperContext({
  apiKey: userSession.zuperApiKey,
  baseUrl: userSession.zuperBaseUrl,
  userId: userSession.userId,
  tenantId: userSession.tenantId,
});

// Create executor
const executor = createContextAwareExecutor(runtimeContext);

// Use tools
const jobs = await mastra.mcpServers.zuper_mcp.tools.listJobs({
  ...executor,
  params: { status: "scheduled" }
});
```

#### Agent Usage:
```typescript
const result = await mastra.agents.dispatcherAgent.generate(
  "Assign job job_123 to best technician",
  { context: { runtime: runtimeContext } }
);
```

## Tool Files to Migrate

The following tool files need to be updated to use the new pattern:

- [ ] `src/mastra/mcp/tools/users.ts`
- [ ] `src/mastra/mcp/tools/teams.ts`
- [ ] `src/mastra/mcp/tools/customers.ts`
- [ ] `src/mastra/mcp/tools/invoices.ts`
- [ ] `src/mastra/mcp/tools/properties.ts`
- [ ] `src/mastra/mcp/tools/timesheets.ts`
- [ ] `src/mastra/mcp/tools/timeoff.ts`
- [ ] `src/mastra/mcp/tools/assets.ts`
- [ ] `src/mastra/mcp/tools/parts.ts`
- [ ] `src/mastra/mcp/tools/contracts.ts`
- [ ] `src/mastra/mcp/tools/quotes.ts`

## Migration Template

Use this template to migrate each tool file:

```typescript
// 1. Update imports
import { makeZuperRequestWithContext, apiCredentialsSchema } from "./common";

// 2. Remove parameters from function
export function createXxxTools() { // Remove parameters
  return {
    toolName: {
      description: "...",
      parameters: apiCredentialsSchema.extend({
        // tool-specific parameters
      }),
      execute: async ({ context, runId, params }: any) => {
        // 3. Extract credentials from params (they're now optional)
        const { apiKey, baseUrl, ...toolData } = params;
        
        // 4. Use makeZuperRequestWithContext
        const result = await makeZuperRequestWithContext(
          "/api/endpoint",
          context,
          { apiKey, baseUrl },
          "METHOD",
          toolData
        );
        
        return {
          status: "success",
          data: result,
        };
      },
    },
  };
}
```

## Benefits After Migration

1. **Cleaner API**: No more repetitive credential parameters
2. **Better Security**: Centralized credential management
3. **Multi-tenant Ready**: Easy to switch contexts per user
4. **Backward Compatible**: Still supports parameter overrides
5. **Agent Friendly**: Easier to use with AI agents

## Testing

After migration, test both patterns:

```typescript
// Test with runtime context
const context = createZuperContext({ apiKey: "test", baseUrl: "test" });
const executor = createContextAwareExecutor(context);
await tool.execute({ ...executor, params: {} });

// Test with parameter override
await tool.execute({
  context: {},
  runId: "test",
  params: { apiKey: "override", baseUrl: "override" }
});
```

## Rollback Plan

If issues arise, the old system can be temporarily restored by:

1. Reverting the `common.ts` changes
2. Updating tool functions to accept parameters again
3. Using the legacy tools in `server.ts` as fallback

The new system is designed to be backward compatible, so both patterns can coexist during migration.