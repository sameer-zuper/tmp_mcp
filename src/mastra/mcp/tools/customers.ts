import { z } from "zod";

export function createCustomerTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    createCustomer: {
      description: "Create a new customer in Zuper FSM",
      parameters: apiCredentialsSchema.extend({
        firstName: z.string().describe("Customer's first name"),
        lastName: z.string().describe("Customer's last name"),
        email: z.string().email().optional().describe("Customer's email address"),
        phone: z.string().optional().describe("Customer's phone number"),
        companyName: z.string().optional().describe("Company name if business customer"),
        address: z
          .object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zipCode: z.string().optional(),
            country: z.string().optional(),
          })
          .optional()
          .describe("Customer address details"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...customerData } = params;
        const result = await makeZuperRequest("/api/customers", apiKey, baseUrl, "POST", customerData);
        return {
          status: "success",
          data: result,
          message: `Customer created successfully with ID: ${result.data?.uid}`,
        };
      },
    },

    getCustomer: {
      description: "Retrieve details of a specific customer by UID",
      parameters: apiCredentialsSchema.extend({
        customerUid: z
          .string()
          .describe("Unique identifier of the customer to retrieve"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, customerUid } = params;
        const result = await makeZuperRequest(
          `/api/customers/${customerUid}`,
          apiKey,
          baseUrl
        );
        return {
          status: "success",
          data: result,
        };
      },
    },

    listCustomers: {
      description: "List all customers with pagination",
      parameters: apiCredentialsSchema.extend({
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
        search: z
          .string()
          .optional()
          .describe("Search customers by name, email, or phone"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, page = 1, limit = 50, search } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (search) {
          queryParams.append("search", search);
        }

        const result = await makeZuperRequest(
          `/api/customers?${queryParams.toString()}`,
          apiKey,
          baseUrl
        );
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },
  };
}
