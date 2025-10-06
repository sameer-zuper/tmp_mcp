import { z } from "zod";

export function createAssetTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    createAsset: {
      description: "Create a new asset for tracking equipment, tools, or resources",
      parameters: apiCredentialsSchema.extend({
        assetName: z.string().describe("Name of the asset"),
        assetType: z.string().optional().describe("Type/category of the asset"),
        customerUid: z
          .string()
          .optional()
          .describe("Customer this asset belongs to"),
        propertyUid: z
          .string()
          .optional()
          .describe("Property where asset is located"),
        serialNumber: z.string().optional().describe("Serial number of the asset"),
        modelNumber: z.string().optional().describe("Model number"),
        manufacturer: z.string().optional().describe("Manufacturer name"),
        installationDate: z
          .string()
          .optional()
          .describe("Installation date in ISO 8601 format"),
        warrantyExpiry: z
          .string()
          .optional()
          .describe("Warranty expiry date in ISO 8601 format"),
        notes: z.string().optional().describe("Additional notes"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...assetData } = params;
        const result = await makeZuperRequest("/api/assets", apiKey, baseUrl, "POST", assetData);
        return {
          status: "success",
          data: result,
          message: `Asset created successfully with ID: ${result.data?.uid}`,
        };
      },
    },

    getAsset: {
      description: "Retrieve details of a specific asset",
      parameters: apiCredentialsSchema.extend({
        assetUid: z.string().describe("Unique identifier of the asset"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, assetUid } = params;
        const result = await makeZuperRequest(`/api/assets/${assetUid}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
        };
      },
    },

    listAssets: {
      description: "List all assets with optional filtering",
      parameters: apiCredentialsSchema.extend({
        customerUid: z
          .string()
          .optional()
          .describe("Filter by customer"),
        propertyUid: z
          .string()
          .optional()
          .describe("Filter by property"),
        assetType: z.string().optional().describe("Filter by asset type"),
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, customerUid, propertyUid, assetType, page = 1, limit = 50 } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (customerUid) queryParams.append("customerUid", customerUid);
        if (propertyUid) queryParams.append("propertyUid", propertyUid);
        if (assetType) queryParams.append("assetType", assetType);

        const result = await makeZuperRequest(`/api/assets?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },
  };
}
