import { z } from "zod";

export function createInvoiceTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    createInvoice: {
      description: "Create a new invoice for a job or customer",
      parameters: apiCredentialsSchema.extend({
        jobUid: z
          .string()
          .optional()
          .describe("Job UID this invoice is associated with"),
        customerUid: z.string().describe("Customer UID for this invoice"),
        invoiceDate: z
          .string()
          .describe("Invoice date in ISO 8601 format"),
        dueDate: z
          .string()
          .optional()
          .describe("Payment due date in ISO 8601 format"),
        lineItems: z
          .array(
            z.object({
              description: z.string(),
              quantity: z.number(),
              unitPrice: z.number(),
              taxRate: z.number().optional(),
            })
          )
          .describe("Line items for the invoice"),
        notes: z.string().optional().describe("Additional notes for the invoice"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...invoiceData } = params;
        const result = await makeZuperRequest("/api/invoice", apiKey, baseUrl, "POST", invoiceData);
        return {
          status: "success",
          data: result,
          message: `Invoice created successfully with ID: ${result.data?.uid}`,
        };
      },
    },

    getInvoice: {
      description: "Retrieve details of a specific invoice by UID",
      parameters: apiCredentialsSchema.extend({
        invoiceUid: z
          .string()
          .describe("Unique identifier of the invoice to retrieve"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, invoiceUid } = params;
        const result = await makeZuperRequest(
          `/api/invoice/${invoiceUid}`,
          apiKey,
          baseUrl
        );
        return {
          status: "success",
          data: result,
        };
      },
    },

    listInvoices: {
      description: "List all invoices with optional filtering",
      parameters: apiCredentialsSchema.extend({
        status: z
          .enum(["draft", "sent", "paid", "overdue", "cancelled"])
          .optional()
          .describe("Filter invoices by status"),
        customerUid: z
          .string()
          .optional()
          .describe("Filter by specific customer"),
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, status, customerUid, page = 1, limit = 50 } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (status) {
          queryParams.append("status", status);
        }
        if (customerUid) {
          queryParams.append("customerUid", customerUid);
        }

        const result = await makeZuperRequest(
          `/api/invoice?${queryParams.toString()}`,
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
