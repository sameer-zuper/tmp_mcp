import { z } from "zod";
import type { ZuperRuntimeContext } from "../../index";

// Default fallback values from environment (for testing/development)
export const DEFAULT_ZUPER_API_KEY = process.env.ZUPER_API_KEY || "";
export const DEFAULT_ZUPER_BASE_URL = process.env.ZUPER_BASE_URL || "";

/**
 * Extract Zuper credentials from runtime context or parameters
 * Priority: params > context > environment defaults
 */
export function getZuperCredentials(
  context: any,
  params: { apiKey?: string; baseUrl?: string }
): { apiKey: string; baseUrl: string } {
  // Try to get from runtime context first
  const runtimeContext = context?.runtime as ZuperRuntimeContext | undefined;
  
  return {
    apiKey: params.apiKey || runtimeContext?.apiKey || DEFAULT_ZUPER_API_KEY,
    baseUrl: params.baseUrl || runtimeContext?.baseUrl || DEFAULT_ZUPER_BASE_URL,
  };
}

/**
 * Validate that we have the required credentials
 */
export function validateCredentials(apiKey: string, baseUrl: string): void {
  if (!apiKey) {
    throw new Error("Zuper API key is required. Provide it via runtime context, tool parameters, or environment variable ZUPER_API_KEY.");
  }
  if (!baseUrl) {
    throw new Error("Zuper base URL is required. Provide it via runtime context, tool parameters, or environment variable ZUPER_BASE_URL.");
  }
}

export async function makeZuperRequest(
  endpoint: string,
  apiKey: string,
  baseUrl: string,
  method: string = "GET",
  body?: any
) {
  validateCredentials(apiKey, baseUrl);
  
  const url = `${baseUrl}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zuper API error (${response.status}): ${errorText || response.statusText}`);
  }

  return response.json();
}

/**
 * Enhanced makeZuperRequest that uses context-aware credential resolution
 */
export async function makeZuperRequestWithContext(
  endpoint: string,
  context: any,
  params: { apiKey?: string; baseUrl?: string },
  method: string = "GET",
  body?: any
) {
  const { apiKey, baseUrl } = getZuperCredentials(context, params);
  return makeZuperRequest(endpoint, apiKey, baseUrl, method, body);
}

// Updated parameter schema - credentials are now optional since they can come from context
export const apiCredentialsSchema = z.object({
  apiKey: z
    .string()
    .optional()
    .describe("Zuper API key for authentication. If not provided, will use runtime context or environment default."),
  baseUrl: z
    .string()
    .optional()
    .describe("Zuper base URL (e.g., https://us.zuperpro.com). If not provided, will use runtime context or environment default."),
});

// Schema without any credentials (for tools that only use runtime context)
export const baseToolSchema = z.object({});
