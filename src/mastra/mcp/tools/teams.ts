import { z } from "zod";

export function createTeamTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    getTeam: {
      description: "Retrieve details of a specific team by UID",
      parameters: apiCredentialsSchema.extend({
        teamUid: z.string().describe("Unique identifier of the team to retrieve"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, teamUid } = params;
        const result = await makeZuperRequest(`/api/team/${teamUid}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
        };
      },
    },

    listTeams: {
      description: "List all teams in the organization",
      parameters: apiCredentialsSchema.extend({
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, page = 1, limit = 50 } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        // Note: Endpoint is /api/team (singular) not /api/teams
        const result = await makeZuperRequest(`/api/team?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },
  };
}
