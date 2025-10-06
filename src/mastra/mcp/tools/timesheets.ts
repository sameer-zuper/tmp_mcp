import { z } from "zod";

export function createTimesheetTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    listTimesheets: {
      description: "Get timesheets for users within a date range to check availability",
      parameters: apiCredentialsSchema.extend({
        userUid: z.string().optional().describe("Filter by specific user"),
        startDate: z
          .string()
          .optional()
          .describe("Start date in ISO 8601 format"),
        endDate: z
          .string()
          .optional()
          .describe("End date in ISO 8601 format"),
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, userUid, startDate, endDate, page = 1, limit = 50 } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (userUid) queryParams.append("userUid", userUid);
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);

        const result = await makeZuperRequest(`/api/timesheets?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },

    getTimesheetSummary: {
      description: "Get timesheet summary for a user to check working hours and availability",
      parameters: apiCredentialsSchema.extend({
        userUid: z.string().describe("User identifier"),
        startDate: z.string().describe("Start date in ISO 8601 format"),
        endDate: z.string().describe("End date in ISO 8601 format"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, userUid, startDate, endDate } = params;
        const queryParams = new URLSearchParams({
          userUid,
          startDate,
          endDate,
        });

        const result = await makeZuperRequest(`/api/timesheets/summary?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
        };
      },
    },
  };
}
