import { z } from "zod";

// Default fallback values from environment (for testing/development)
export const DEFAULT_ZUPER_API_KEY = process.env.ZUPER_API_KEY || "";
export const DEFAULT_ZUPER_BASE_URL = process.env.ZUPER_BASE_URL || "";

export async function makeZuperRequest(
  endpoint: string,
  apiKey: string,
  baseUrl: string,
  method: string = "GET",
  body?: any
) {
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

// Common parameter schema for API credentials
// These are optional - if not provided, will use defaults from environment
export const apiCredentialsSchema = z.object({
  apiKey: z
    .string()
    .optional()
    .describe("Zuper API key for authentication (x-api-key header). If not provided, uses default from environment."),
  baseUrl: z
    .string()
    .optional()
    .describe("Zuper base URL (e.g., https://us.zuperpro.com). If not provided, uses default from environment."),
});
