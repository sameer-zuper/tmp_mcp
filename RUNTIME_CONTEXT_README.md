# Runtime Context System for Zuper FSM MCP Server

## Overview

The Zuper FSM MCP Server now uses **Mastra's Runtime Context** for credential management, providing a cleaner, more secure, and multi-tenant-friendly approach to handling API keys and base URLs.

## Key Benefits

✅ **Cleaner API**: No more repetitive `apiKey` and `baseUrl` parameters  
✅ **Multi-tenant Support**: Easy context switching per user/tenant  
✅ **Better Security**: Centralized credential management  
✅ **Backward Compatible**: Still supports parameter overrides  
✅ **Agent Friendly**: Seamless integration with AI agents  

## Quick Start

### 1. Create Runtime Context

```typescript
import { createZuperContext } from "./mastra/context/manager";

const runtimeContext = createZuperContext({
  apiKey: "your_zuper_api_key",
  baseUrl: "https://your-region.zuperpro.com",
  userId: "user_123",
  tenantId: "tenant_456"
});
```

### 2. Use Tools with Context

```typescript
import { createContextAwareExecutor } from "./mastra/context/manager";

const executor = createContextAwareExecutor(runtimeContext);

// Clean tool usage - no credentials needed!
const jobs = await mastra.mcpServers.zuper_mcp.tools.listJobs({
  ...executor,
  params: {
    status: "scheduled",
    page: 1,
    limit: 10
  }
});
```

### 3. Use with Agents

```typescript
const result = await mastra.agents.dispatcherAgent.generate(
  "Assign job job_123 to the best technician",
  { context: { runtime: runtimeContext } }
);
```

## Integration Patterns

### Web Application (React/Next.js)

```typescript
// lib/zuper-context.ts
export function createUserZuperContext(userSession: UserSession) {
  return createZuperContext({
    apiKey: userSession.zuperApiKey,
    baseUrl: userSession.zuperBaseUrl,
    userId: userSession.userId,
    tenantId: userSession.tenantId,
  });
}

// pages/api/jobs.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userSession = await getUserSession(req);
  const context = createUserZuperContext(userSession);
  const executor = createContextAwareExecutor(context);

  const jobs = await mastra.mcpServers.zuper_mcp.tools.listJobs({
    ...executor,
    params: { status: req.query.status }
  });

  res.json(jobs);
}
```

### Express.js Backend

```typescript
// middleware/zuper-context.ts
export const zuperContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-zuper-api-key'] as string;
  const baseUrl = req.headers['x-zuper-base-url'] as string;

  req.zuperContext = createZuperContext({
    apiKey,
    baseUrl,
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
  });

  next();
};

// routes/jobs.ts
app.get('/api/jobs', zuperContextMiddleware, async (req, res) => {
  const executor = createContextAwareExecutor(req.zuperContext);
  
  const jobs = await mastra.mcpServers.zuper_mcp.tools.listJobs({
    ...executor,
    params: { status: req.query.status }
  });

  res.json(jobs);
});
```

### Mobile App (React Native)

```typescript
// services/zuper-service.ts
class ZuperService {
  private context: ZuperRuntimeContext;

  constructor(credentials: { apiKey: string; baseUrl: string }) {
    this.context = createZuperContext({
      ...credentials,
      userId: 'mobile_user',
    });
  }

  async getJobs(status?: string) {
    const executor = createContextAwareExecutor(this.context);
    
    return await mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: { status }
    });
  }
}
```

## Advanced Usage

### Context Switching (Multi-tenant)

```typescript
class MultiTenantZuperService {
  private contexts: Map<string, ZuperRuntimeContext> = new Map();

  setTenantContext(tenantId: string, credentials: { apiKey: string; baseUrl: string }) {
    this.contexts.set(tenantId, createZuperContext({
      ...credentials,
      tenantId,
    }));
  }

  async getJobsForTenant(tenantId: string, status?: string) {
    const context = this.contexts.get(tenantId);
    if (!context) throw new Error(`No context for tenant ${tenantId}`);

    const executor = createContextAwareExecutor(context);
    
    return await mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: { status }
    });
  }
}
```

### Parameter Override (Hybrid Approach)

```typescript
// Use context as default, but allow parameter override
const executor = createContextAwareExecutor(defaultContext);

const jobs = await mastra.mcpServers.zuper_mcp.tools.listJobs({
  ...executor,
  params: {
    // These override the context values for this specific call
    apiKey: "special_api_key",
    baseUrl: "https://special.zuperpro.com",
    status: "urgent"
  }
});
```

### Batch Operations

```typescript
async function performBatchOperations(context: ZuperRuntimeContext) {
  const executor = createContextAwareExecutor(context);

  const [scheduledJobs, inProgressJobs, completedJobs] = await Promise.all([
    mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: { status: "scheduled" }
    }),
    mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: { status: "in_progress" }
    }),
    mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: { status: "completed" }
    }),
  ]);

  return { scheduledJobs, inProgressJobs, completedJobs };
}
```

## Security Best Practices

### 1. Never Expose Credentials Client-Side

```typescript
// ❌ DON'T: Expose API keys in client code
const context = createZuperContext({
  apiKey: "exposed_api_key", // This will be visible to users!
  baseUrl: "https://us.zuperpro.com"
});

// ✅ DO: Keep credentials on the server
// Client sends user token, server creates context
const context = createZuperContext({
  apiKey: process.env.ZUPER_API_KEY, // Server-side only
  baseUrl: process.env.ZUPER_BASE_URL
});
```

### 2. Validate Context Before Use

```typescript
import { validateZuperContext } from "./mastra/context/manager";

function secureToolCall(context: any) {
  if (!validateZuperContext(context)) {
    throw new Error("Invalid Zuper context - missing credentials");
  }
  
  // Safe to proceed
  const executor = createContextAwareExecutor(context.runtime);
  // ...
}
```

### 3. Use Environment Variables for Defaults

```typescript
// .env
ZUPER_API_KEY=your_default_api_key
ZUPER_BASE_URL=https://your-region.zuperpro.com

// Code
const context = createZuperContext({
  apiKey: userApiKey || process.env.ZUPER_API_KEY!,
  baseUrl: userBaseUrl || process.env.ZUPER_BASE_URL!,
  userId: user.id
});
```

## Error Handling

The new system provides clear error messages for missing credentials:

```typescript
try {
  const jobs = await mastra.mcpServers.zuper_mcp.tools.listJobs({
    context: {}, // No runtime context
    runId: "test",
    params: {} // No apiKey/baseUrl parameters
  });
} catch (error) {
  console.error(error.message);
  // "Zuper API key is required. Provide it via:
  //  1. Tool parameter: { apiKey: 'your-key' }
  //  2. Runtime context: context.runtime.apiKey
  //  3. Environment variable: ZUPER_API_KEY"
}
```

## Migration Status

### ✅ Completed
- Runtime context infrastructure
- Job management tools (6 tools)
- Context manager utilities
- Usage examples and documentation

### 🚧 In Progress
- User management tools
- Team management tools
- Customer management tools
- Invoice management tools
- Property management tools
- Timesheet tools
- Time-off management tools
- Asset management tools
- Parts & inventory tools
- Service contract tools
- Quote management tools

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed migration instructions.

## API Reference

### Types

```typescript
interface ZuperRuntimeContext {
  apiKey: string;
  baseUrl: string;
  userId?: string;
  tenantId?: string;
  organizationId?: string;
}
```

### Functions

```typescript
// Create runtime context
createZuperContext(config: {
  apiKey: string;
  baseUrl: string;
  userId?: string;
  tenantId?: string;
  organizationId?: string;
}): ZuperRuntimeContext

// Validate context
validateZuperContext(context: any): boolean

// Resolve credentials with priority
resolveZuperCredentials(
  context: any,
  params?: { apiKey?: string; baseUrl?: string }
): { apiKey: string; baseUrl: string }

// Create context-aware executor
createContextAwareExecutor(context: ZuperRuntimeContext): {
  context: { runtime: ZuperRuntimeContext };
  runId: string;
}
```

## Examples

See [src/examples/runtime-context-usage.ts](src/examples/runtime-context-usage.ts) for comprehensive usage examples including:

- Web application integration
- Backend service usage
- Mobile app patterns
- Agent integration
- Batch operations
- Express.js middleware
- Multi-tenant scenarios

## Support

For questions or issues with the runtime context system:

1. Check the [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
2. Review the examples in [src/examples/](src/examples/)
3. Ensure your Mastra version supports runtime context
4. Verify your environment variables are set correctly

The new system is designed to be intuitive and backward-compatible, making the transition smooth while providing significant improvements in usability and security.