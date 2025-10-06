import { z } from "zod";

export function createServiceContractTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    createServiceContract: {
      description: "Create a new service contract for recurring maintenance or services",
      parameters: apiCredentialsSchema.extend({
        customerUid: z.string().describe("Customer identifier"),
        contractName: z.string().describe("Name of the service contract"),
        contractType: z
          .string()
          .optional()
          .describe("Type of contract (e.g., maintenance, support)"),
        startDate: z.string().describe("Contract start date in ISO 8601 format"),
        endDate: z.string().describe("Contract end date in ISO 8601 format"),
        recurringSchedule: z
          .string()
          .optional()
          .describe("Recurrence pattern (e.g., monthly, quarterly)"),
        value: z.number().optional().describe("Contract value/amount"),
        description: z.string().optional().describe("Contract description"),
        terms: z.string().optional().describe("Contract terms and conditions"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...contractData } = params;
        const result = await makeZuperRequest("/api/service_contract", apiKey, baseUrl, "POST", contractData);
        return {
          status: "success",
          data: result,
          message: `Service contract created successfully with ID: ${result.data?.uid}`,
        };
      },
    },

    getServiceContract: {
      description: "Retrieve details of a specific service contract",
      parameters: apiCredentialsSchema.extend({
        contractUid: z.string().describe("Unique identifier of the service contract"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, contractUid } = params;
        const result = await makeZuperRequest(`/api/service_contract/${contractUid}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
        };
      },
    },

    listServiceContracts: {
      description: "List all service contracts with optional filtering",
      parameters: apiCredentialsSchema.extend({
        customerUid: z
          .string()
          .optional()
          .describe("Filter by customer"),
        status: z
          .enum(["active", "expired", "cancelled"])
          .optional()
          .describe("Filter by contract status"),
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

        const result = await makeZuperRequest(`/api/service_contract?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },
  };
}
