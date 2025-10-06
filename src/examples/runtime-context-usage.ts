/**
 * Runtime Context Usage Examples
 * 
 * This file demonstrates how to use the improved runtime context system
 * for passing Zuper credentials instead of requiring them as parameters.
 */

import { mastra } from "../mastra/index";
import { createZuperContext, createContextAwareExecutor } from "../mastra/context/manager";

// Example 1: Web Application with User Sessions
export async function webAppExample() {
  // Simulate user session data
  const userSession = {
    userId: "user_123",
    zuperApiKey: "zuper_api_key_abc123",
    zuperBaseUrl: "https://us.zuperpro.com",
    tenantId: "tenant_456"
  };

  // Create runtime context from user session
  const runtimeContext = createZuperContext({
    apiKey: userSession.zuperApiKey,
    baseUrl: userSession.zuperBaseUrl,
    userId: userSession.userId,
    tenantId: userSession.tenantId,
  });

  // Create context-aware executor
  const executor = createContextAwareExecutor(runtimeContext);

  // Now tools can be called without passing apiKey/baseUrl parameters
  try {
    const jobs = await mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: {
        status: "scheduled",
        page: 1,
        limit: 10
      }
    });

    console.log("Jobs retrieved:", jobs.data?.length);
    return jobs;
  } catch (error) {
    console.error("Error retrieving jobs:", error);
    throw error;
  }
}

// Example 2: Backend Service with Environment Variables
export async function backendServiceExample() {
  // Runtime context from environment (fallback)
  const runtimeContext = createZuperContext({
    apiKey: process.env.ZUPER_API_KEY!,
    baseUrl: process.env.ZUPER_BASE_URL!,
    organizationId: process.env.ORGANIZATION_ID,
  });

  const executor = createContextAwareExecutor(runtimeContext);

  // Create a job without passing credentials
  try {
    const newJob = await mastra.mcpServers.zuper_mcp.tools.createJob({
      ...executor,
      params: {
        customerUid: "customer_789",
        jobTitle: "Emergency Repair",
        jobDescription: "Urgent HVAC repair needed",
        priority: "urgent"
      }
    });

    console.log("Job created:", newJob.data?.uid);
    return newJob;
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
}

// Example 3: Mobile App with Stored Credentials
export async function mobileAppExample() {
  // Simulate stored credentials from mobile app
  const storedCredentials = {
    apiKey: "mobile_api_key_xyz789",
    baseUrl: "https://eu.zuperpro.com",
  };

  const runtimeContext = createZuperContext({
    apiKey: storedCredentials.apiKey,
    baseUrl: storedCredentials.baseUrl,
    userId: "mobile_user_456",
  });

  const executor = createContextAwareExecutor(runtimeContext);

  // Get job details
  try {
    const job = await mastra.mcpServers.zuper_mcp.tools.getJob({
      ...executor,
      params: {
        jobUid: "job_123456"
      }
    });

    console.log("Job details:", job.data?.jobTitle);
    return job;
  } catch (error) {
    console.error("Error getting job:", error);
    throw error;
  }
}

// Example 4: Agent Usage with Runtime Context
export async function agentWithContextExample() {
  const userCredentials = {
    apiKey: "agent_api_key_def456",
    baseUrl: "https://ca.zuperpro.com",
  };

  const runtimeContext = createZuperContext({
    apiKey: userCredentials.apiKey,
    baseUrl: userCredentials.baseUrl,
    userId: "agent_user_789",
    tenantId: "agent_tenant_123",
  });

  // Use dispatcher agent with runtime context
  try {
    const result = await mastra.agents.dispatcherAgent.generate(
      "Please assign job job_789123 to the most suitable technician.",
      {
        context: { runtime: runtimeContext }
      }
    );

    console.log("Agent result:", result.text);
    return result;
  } catch (error) {
    console.error("Error with agent:", error);
    throw error;
  }
}

// Example 5: Hybrid Approach - Context + Parameter Override
export async function hybridExample() {
  // Set default context
  const defaultContext = createZuperContext({
    apiKey: "default_api_key",
    baseUrl: "https://us.zuperpro.com",
    tenantId: "default_tenant",
  });

  const executor = createContextAwareExecutor(defaultContext);

  // Override specific credentials for this call
  try {
    const jobs = await mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: {
        // These will override the context values
        apiKey: "override_api_key",
        baseUrl: "https://eu.zuperpro.com",
        status: "in_progress"
      }
    });

    console.log("Jobs with override:", jobs.data?.length);
    return jobs;
  } catch (error) {
    console.error("Error with override:", error);
    throw error;
  }
}

// Example 6: Express.js Middleware Pattern
export function createZuperMiddleware() {
  return (req: any, res: any, next: any) => {
    // Extract credentials from request (headers, JWT, session, etc.)
    const apiKey = req.headers['x-zuper-api-key'] || req.user?.zuperApiKey;
    const baseUrl = req.headers['x-zuper-base-url'] || req.user?.zuperBaseUrl;

    if (!apiKey || !baseUrl) {
      return res.status(401).json({ error: "Zuper credentials required" });
    }

    // Create runtime context and attach to request
    req.zuperContext = createZuperContext({
      apiKey,
      baseUrl,
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
    });

    next();
  };
}

// Express route using the middleware
export async function expressRouteExample(req: any, res: any) {
  const executor = createContextAwareExecutor(req.zuperContext);

  try {
    const jobs = await mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: {
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      }
    });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Example 7: Batch Operations with Context
export async function batchOperationsExample() {
  const runtimeContext = createZuperContext({
    apiKey: "batch_api_key",
    baseUrl: "https://us.zuperpro.com",
    organizationId: "org_123",
  });

  const executor = createContextAwareExecutor(runtimeContext);

  // Perform multiple operations with the same context
  const operations = [
    () => mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: { status: "scheduled" }
    }),
    () => mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: { status: "in_progress" }
    }),
    () => mastra.mcpServers.zuper_mcp.tools.listJobs({
      ...executor,
      params: { status: "completed" }
    }),
  ];

  try {
    const results = await Promise.all(operations.map(op => op()));
    console.log("Batch results:", results.map(r => r.data?.length));
    return results;
  } catch (error) {
    console.error("Batch operation error:", error);
    throw error;
  }
}

// Export all examples for testing
export const examples = {
  webApp: webAppExample,
  backendService: backendServiceExample,
  mobileApp: mobileAppExample,
  agentWithContext: agentWithContextExample,
  hybrid: hybridExample,
  batchOperations: batchOperationsExample,
};