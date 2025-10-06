import { z } from "zod";

export function createTimeOffTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    listTimeOffRequests: {
      description:
        "List time-off requests to check which users are unavailable for job assignment",
      parameters: apiCredentialsSchema.extend({
        userUid: z.string().optional().describe("Filter by specific user UID"),
        teamUid: z.string().optional().describe("Filter by specific team UID"),
        fromDate: z
          .string()
          .optional()
          .describe("Filter time-offs from this date (YYYY-MM-DD format)"),
        toDate: z
          .string()
          .optional()
          .describe("Filter time-offs to this date (YYYY-MM-DD format)"),
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, userUid, teamUid, fromDate, toDate, page = 1, limit = 50 } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (userUid) queryParams.append("filter.user_uid", userUid);
        if (teamUid) queryParams.append("filter.team_uid", teamUid);
        if (fromDate) queryParams.append("filter.from_date", fromDate);
        if (toDate) queryParams.append("filter.to_date", toDate);

        // Note: Time-off is under timesheets
        const result = await makeZuperRequest(`/api/timesheets/request/timeoff?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },

    checkTimeOffAvailability: {
      description:
        "Check if a user is available during a specific date range (not on time-off)",
      parameters: apiCredentialsSchema.extend({
        userUid: z.string().describe("User identifier to check availability"),
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

        // Note: Availability check endpoint - may need different path
        const result = await makeZuperRequest(`/api/timesheets/request/timeoff/availability?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          available: result.available || false,
        };
      },
    },
  };
}
