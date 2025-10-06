import { z } from "zod";

export function createPartTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    createPart: {
      description: "Create a new part/service item in inventory",
      parameters: apiCredentialsSchema.extend({
        partName: z.string().describe("Name of the part or service"),
        partType: z
          .enum(["part", "service"])
          .describe("Type: part for physical items, service for labor"),
        sku: z.string().optional().describe("Stock Keeping Unit (SKU)"),
        description: z.string().optional().describe("Part description"),
        unitPrice: z.number().optional().describe("Price per unit"),
        quantity: z.number().optional().describe("Available quantity in stock"),
        unit: z.string().optional().describe("Unit of measurement (e.g., pcs, hours)"),
        category: z.string().optional().describe("Part category"),
        vendor: z.string().optional().describe("Vendor/supplier name"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...partData } = params;
        const result = await makeZuperRequest("/api/product", apiKey, baseUrl, "POST", partData);
        return {
          status: "success",
          data: result,
          message: `Part created successfully with ID: ${result.data?.uid}`,
        };
      },
    },

    getPart: {
      description: "Retrieve details of a specific part or service",
      parameters: apiCredentialsSchema.extend({
        partUid: z.string().describe("Unique identifier of the part"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, partUid } = params;
        const result = await makeZuperRequest(`/api/product/${partUid}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
        };
      },
    },

    listParts: {
      description: "List all parts and services in inventory",
      parameters: apiCredentialsSchema.extend({
        partType: z
          .enum(["part", "service"])
          .optional()
          .describe("Filter by type"),
        category: z.string().optional().describe("Filter by category"),
        search: z
          .string()
          .optional()
          .describe("Search by name, SKU, or description"),
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, partType, category, search, page = 1, limit = 50 } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (partType) queryParams.append("type", partType);
        if (category) queryParams.append("category", category);
        if (search) queryParams.append("search", search);

        const result = await makeZuperRequest(`/api/product?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },
  };
}
