import { z } from "zod";

export function createUserTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    getUser: {
      description: "Retrieve details of a specific user by UID",
      parameters: apiCredentialsSchema.extend({
        userUid: z.string().describe("Unique identifier of the user to retrieve"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, userUid } = params;
        const result = await makeZuperRequest(`/api/user/${userUid}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
        };
      },
    },

    listUsers: {
      description:
        "List all users in the organization with their details, skills, and availability",
      parameters: apiCredentialsSchema.extend({
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
        status: z
          .enum(["active", "inactive"])
          .optional()
          .describe("Filter by user status"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, page = 1, limit = 50, status } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (status) {
          queryParams.append("status", status);
        }

        const result = await makeZuperRequest(`/api/user/all?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },

    getUserSkills: {
      description: "Get the skills assigned to a specific user for job matching",
      parameters: apiCredentialsSchema.extend({
        userUid: z.string().describe("Unique identifier of the user"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, userUid } = params;
        const result = await makeZuperRequest(`/api/users/${userUid}/skill`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
        };
      },
    },

    getUserTeams: {
      description: "Get all teams that a user belongs to. Returns team information including the primary team UID needed for job assignment.",
      parameters: apiCredentialsSchema.extend({
        userUid: z.string().describe("Unique identifier of the user"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, userUid } = params;
        const result = await makeZuperRequest(`/api/user/${userUid}/teams`, apiKey, baseUrl);

        // Return simplified team data
        const teams = result?.data || [];
        return {
          type: "success",
          user_uid: userUid,
          teams: teams.map((team: any) => ({
            team_uid: team.team_uid,
            team_name: team.team_name,
          })),
          primary_team_uid: teams.length > 0 ? teams[0].team_uid : null, // First team as primary
        };
      },
    },
  };
}
