/**
 * Runtime Context Manager for Zuper FSM MCP Server
 * 
 * This module provides utilities for managing runtime context,
 * particularly for handling multi-tenant Zuper credentials.
 */

import type { ZuperRuntimeContext } from "../index";

/**
 * Create a runtime context for Zuper operations
 */
export function createZuperContext(config: {
  apiKey: string;
  baseUrl: string;
  userId?: string;
  tenantId?: string;
  organizationId?: string;
}): ZuperRuntimeContext {
  return {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    userId: config.userId,
    tenantId: config.tenantId,
    organizationId: config.organizationId,
  };
}

/**
 * Validate runtime context has required Zuper credentials
 */
export function validateZuperContext(context: any): context is { runtime: ZuperRuntimeContext } {
  const runtime = context?.runtime;
  return !!(runtime?.apiKey && runtime?.baseUrl);
}

/**
 * Extract Zuper credentials from various sources with priority:
 * 1. Direct parameters
 * 2. Runtime context
 * 3. Environment variables
 */
export function resolveZuperCredentials(
  context: any,
  params: { apiKey?: string; baseUrl?: string } = {}
): { apiKey: string; baseUrl: string } {
  const runtime = context?.runtime as ZuperRuntimeContext | undefined;
  
  const apiKey = params.apiKey || runtime?.apiKey || process.env.ZUPER_API_KEY;
  const baseUrl = params.baseUrl || runtime?.baseUrl || process.env.ZUPER_BASE_URL;

  if (!apiKey) {
    throw new Error(
      "Zuper API key is required. Provide it via:\n" +
      "1. Tool parameter: { apiKey: 'your-key' }\n" +
      "2. Runtime context: context.runtime.apiKey\n" +
      "3. Environment variable: ZUPER_API_KEY"
    );
  }

  if (!baseUrl) {
    throw new Error(
      "Zuper base URL is required. Provide it via:\n" +
      "1. Tool parameter: { baseUrl: 'https://your-region.zuperpro.com' }\n" +
      "2. Runtime context: context.runtime.baseUrl\n" +
      "3. Environment variable: ZUPER_BASE_URL"
    );
  }

  return { apiKey, baseUrl };
}

/**
 * Middleware function to inject runtime context into Mastra operations
 */
export function withZuperContext<T extends (...args: any[]) => any>(
  fn: T,
  context: ZuperRuntimeContext
): T {
  return ((...args: any[]) => {
    // Inject context into the first argument if it's an object
    if (args[0] && typeof args[0] === 'object') {
      args[0].context = { runtime: context };
    }
    return fn(...args);
  }) as T;
}

/**
 * Helper to create a context-aware tool executor
 */
export function createContextAwareExecutor(
  context: ZuperRuntimeContext
) {
  return {
    context: { runtime: context },
    runId: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Example usage patterns for different integration scenarios
 */
export const examples = {
  // Web application with user sessions
  webApp: (userSession: { zuperApiKey: string; zuperBaseUrl: string }) => {
    return createZuperContext({
      apiKey: userSession.zuperApiKey,
      baseUrl: userSession.zuperBaseUrl,
      userId: 'user_123',
      tenantId: 'tenant_456',
    });
  },

  // Backend service with environment config
  backendService: () => {
    return createZuperContext({
      apiKey: process.env.ZUPER_API_KEY!,
      baseUrl: process.env.ZUPER_BASE_URL!,
      organizationId: process.env.ORGANIZATION_ID,
    });
  },

  // Mobile app with stored credentials
  mobileApp: (credentials: { apiKey: string; baseUrl: string }) => {
    return createZuperContext({
      apiKey: credentials.apiKey,
      baseUrl: credentials.baseUrl,
      userId: 'mobile_user_789',
    });
  },
};