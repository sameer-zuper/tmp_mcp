import { z } from "zod";

export function createQuoteTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    createQuote: {
      description: "Create a new quote/estimate for a customer",
      parameters: apiCredentialsSchema.extend({
        customerUid: z.string().describe("Customer identifier"),
        jobUid: z
          .string()
          .optional()
          .describe("Associated job identifier"),
        quoteDate: z.string().describe("Quote date in ISO 8601 format"),
        validUntil: z
          .string()
          .optional()
          .describe("Quote valid until date in ISO 8601 format"),
        lineItems: z
          .array(
            z.object({
              description: z.string(),
              quantity: z.number(),
              unitPrice: z.number(),
              taxRate: z.number().optional(),
            })
          )
          .describe("Line items for the quote"),
        notes: z.string().optional().describe("Additional notes"),
        terms: z.string().optional().describe("Terms and conditions"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...quoteData } = params;
        const result = await makeZuperRequest("/api/estimate", apiKey, baseUrl, "POST", quoteData);
        return {
          status: "success",
          data: result,
          message: `Quote created successfully with ID: ${result.data?.uid}`,
        };
      },
    },

    getQuote: {
      description: "Retrieve details of a specific quote",
      parameters: apiCredentialsSchema.extend({
        quoteUid: z.string().describe("Unique identifier of the quote"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, quoteUid } = params;
        const result = await makeZuperRequest(`/api/estimate/${quoteUid}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
        };
      },
    },

    listQuotes: {
      description: "List all quotes with optional filtering",
      parameters: apiCredentialsSchema.extend({
        customerUid: z
          .string()
          .optional()
          .describe("Filter by customer"),
        status: z
          .enum(["draft", "sent", "accepted", "rejected", "expired"])
          .optional()
          .describe("Filter by quote status"),
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, customerUid, status, page = 1, limit = 50 } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (customerUid) queryParams.append("customerUid", customerUid);
        if (status) queryParams.append("status", status);

        const result = await makeZuperRequest(`/api/estimate?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },
  };
}
