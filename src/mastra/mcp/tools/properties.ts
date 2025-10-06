import { z } from "zod";

export function createPropertyTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    createProperty: {
      description: "Create a new property/location for a customer",
      parameters: apiCredentialsSchema.extend({
        customerUid: z
          .string()
          .describe("Customer UID this property belongs to"),
        propertyName: z.string().describe("Name of the property"),
        address: z.object({
          street: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string(),
          country: z.string(),
        }),
        propertyType: z
          .string()
          .optional()
          .describe("Type of property (residential, commercial, etc.)"),
        notes: z.string().optional(),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...propertyData } = params;
        const result = await makeZuperRequest("/api/property", apiKey, baseUrl, "POST", propertyData);
        return {
          status: "success",
          data: result,
          message: `Property created successfully with ID: ${result.data?.uid}`,
        };
      },
    },

    getProperty: {
      description: "Retrieve details of a specific property by UID",
      parameters: apiCredentialsSchema.extend({
        propertyUid: z
          .string()
          .describe("Unique identifier of the property to retrieve"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, propertyUid } = params;
        // Note: Endpoint is /api/property (singular)
        const result = await makeZuperRequest(
          `/api/property/${propertyUid}`,
          apiKey,
          baseUrl
        );
        return {
          status: "success",
          data: result,
        };
      },
    },
  };
}
