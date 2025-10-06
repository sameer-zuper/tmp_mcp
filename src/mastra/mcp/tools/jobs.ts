import { z } from "zod";

export function createJobTools(makeZuperRequest: Function, apiCredentialsSchema: z.ZodObject<any>, DEFAULT_ZUPER_API_KEY: string, DEFAULT_ZUPER_BASE_URL: string) {
  return {
    createJob: {
      description:
        "Create a new job/work order in Zuper FSM with customer, property, and service details",
      parameters: apiCredentialsSchema.extend({
        customerUid: z
          .string()
          .describe("Unique identifier of the customer for this job"),
        jobTitle: z.string().describe("Title or name of the job"),
        jobDescription: z.string().optional().describe("Description of the job"),
        propertyUid: z
          .string()
          .optional()
          .describe("Property/location identifier for the job"),
        scheduledStartTime: z
          .string()
          .optional()
          .describe("Scheduled start time in ISO 8601 format"),
        scheduledEndTime: z
          .string()
          .optional()
          .describe("Scheduled end time in ISO 8601 format"),
        priority: z
          .enum(["low", "medium", "high", "urgent"])
          .optional()
          .describe("Priority level of the job"),
        assignedTo: z
          .array(z.string())
          .optional()
          .describe("Array of user UIDs to assign to this job"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, ...jobData } = params;
        const result = await makeZuperRequest("/api/jobs", apiKey, baseUrl, "POST", jobData);
        return {
          status: "success",
          data: result,
          message: `Job created successfully with ID: ${result.data?.uid}`,
        };
      },
    },

    getJob: {
      description: "Retrieve details of a specific job by its UID",
      parameters: apiCredentialsSchema.extend({
        jobUid: z.string().describe("Unique identifier of the job to retrieve"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, jobUid } = params;
        const result = await makeZuperRequest(`/api/jobs/${jobUid}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
        };
      },
    },

    listJobs: {
      description:
        "List all jobs with optional filtering by status, date range, or customer",
      parameters: apiCredentialsSchema.extend({
        status: z
          .enum([
            "scheduled",
            "in_progress",
            "completed",
            "cancelled",
            "on_hold",
          ])
          .optional()
          .describe("Filter jobs by status"),
        page: z.number().optional().default(1).describe("Page number for pagination"),
        limit: z.number().optional().default(50).describe("Number of results per page"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, status, page = 1, limit = 50 } = params;
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (status) {
          queryParams.append("status", status);
        }

        const result = await makeZuperRequest(`/api/jobs?${queryParams.toString()}`, apiKey, baseUrl);
        return {
          status: "success",
          data: result,
          count: result.data?.length || 0,
        };
      },
    },

    updateJob: {
      description: "Update an existing job with new information",
      parameters: apiCredentialsSchema.extend({
        jobUid: z.string().describe("Unique identifier of the job to update"),
        updates: z
          .object({
            jobTitle: z.string().optional(),
            jobDescription: z.string().optional(),
            status: z
              .enum([
                "scheduled",
                "in_progress",
                "completed",
                "cancelled",
                "on_hold",
              ])
              .optional(),
            priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
            scheduledStartTime: z.string().optional(),
            scheduledEndTime: z.string().optional(),
          })
          .describe("Fields to update"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, jobUid, updates } = params;
        const result = await makeZuperRequest(
          `/api/jobs/${jobUid}`,
          apiKey,
          baseUrl,
          "PUT",
          updates
        );
        return {
          status: "success",
          data: result,
          message: `Job ${jobUid} updated successfully`,
        };
      },
    },

    assignJob: {
      description: "Assign technicians or teams to a job",
      parameters: apiCredentialsSchema.extend({
        jobUid: z.string().describe("Job UID to assign technicians/teams to"),
        users: z.array(z.object({
          userUid: z.string().describe("User UID"),
          teamUid: z.string().describe("Team UID the user belongs to"),
        })).optional().describe("Array of users to assign (each with user_uid and team_uid)"),
        teams: z.array(z.string()).optional().describe("Array of team UIDs to assign"),
        updateAllJobs: z.boolean().optional().describe("Whether to update all jobs (default: false)"),
        notifyUsers: z.boolean().optional().describe("Whether to notify users (default: false)"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, jobUid, users = [], teams = [], updateAllJobs = false, notifyUsers = false } = params;

        const assignmentData: any = {
          job_uid: jobUid,
          type: "ASSIGN",
          update_all_jobs: updateAllJobs,
          notify_users: notifyUsers,
        };

        if (users.length > 0) {
          assignmentData.users = users.map((u: any) => ({
            user_uid: u.userUid,
            team_uid: u.teamUid,
          }));
        }

        if (teams.length > 0) {
          assignmentData.teams = teams;
        }

        const result = await makeZuperRequest(
          `/api/jobs/assign`,
          apiKey,
          baseUrl,
          "POST",
          assignmentData
        );
        return {
          status: "success",
          data: result,
          message: `Successfully assigned ${users.length + teams.length} user(s)/team(s) to job ${jobUid}`,
        };
      },
    },

    unassignJob: {
      description: "Unassign technicians or teams from a job",
      parameters: apiCredentialsSchema.extend({
        jobUid: z.string().describe("Job UID to unassign technicians/teams from"),
        users: z.array(z.object({
          userUid: z.string().describe("User UID"),
          teamUid: z.string().describe("Team UID the user belongs to"),
        })).optional().describe("Array of users to unassign (each with user_uid and team_uid)"),
        teams: z.array(z.string()).optional().describe("Array of team UIDs to unassign"),
        updateAllJobs: z.boolean().optional().describe("Whether to update all jobs (default: false)"),
        notifyUsers: z.boolean().optional().describe("Whether to notify users (default: false)"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL, jobUid, users = [], teams = [], updateAllJobs = false, notifyUsers = false } = params;

        const assignmentData: any = {
          job_uid: jobUid,
          type: "UNASSIGN",
          update_all_jobs: updateAllJobs,
          notify_users: notifyUsers,
        };

        if (users.length > 0) {
          assignmentData.users = users.map((u: any) => ({
            user_uid: u.userUid,
            team_uid: u.teamUid,
          }));
        }

        if (teams.length > 0) {
          assignmentData.teams = teams;
        }

        const result = await makeZuperRequest(
          `/api/jobs/assign`,
          apiKey,
          baseUrl,
          "POST",
          assignmentData
        );
        return {
          status: "success",
          data: result,
          message: `Successfully unassigned ${users.length + teams.length} user(s)/team(s) from job ${jobUid}`,
        };
      },
    },

    assistedScheduling: {
      description: "Get intelligent scheduling recommendations based on availability, skills, location, and other factors. Returns optimal time slots and user suggestions for a job.",
      parameters: apiCredentialsSchema.extend({
        fromDate: z.string().describe("Start datetime for scheduling window (YYYY-MM-DD HH:mm:ss format, e.g., '2025-10-06 00:00:00')"),
        toDate: z.string().describe("End datetime for scheduling window (YYYY-MM-DD HH:mm:ss format, e.g., '2025-10-13 23:59:59')"),
        jobUid: z.string().optional().describe("Job UID to schedule"),
        jobCategory: z.string().optional().describe("Job category"),
        jobDuration: z.number().optional().describe("Job duration in minutes"),
        serviceTerritory: z.string().optional().describe("Service territory"),
        zipcode: z.string().optional().describe("Customer zipcode for location-based scheduling"),
        timezone: z.string().optional().describe("Timezone (e.g., 'America/New_York')"),
        skillsetUid: z.string().optional().describe("Required skillset UID"),
        teamUid: z.string().optional().describe("Filter by team UID"),
        userUid: z.string().optional().describe("Filter by specific user UID"),
        customerUid: z.string().optional().describe("Customer UID"),
        favoriteUser: z.boolean().optional().describe("Prioritize customer's favorite users"),
        userType: z.string().optional().describe("User type filter"),
        considerHolidays: z.boolean().optional().describe("Consider company holidays in scheduling"),
        considerOnlyUserShifts: z.boolean().optional().describe("Only schedule during user's defined shifts"),
      }),
      execute: async ({ context, runId, params }: any) => {
        const { apiKey = DEFAULT_ZUPER_API_KEY, baseUrl = DEFAULT_ZUPER_BASE_URL } = params;

        // Build query params
        const queryParams = new URLSearchParams();
        if (params.fromDate) queryParams.append('from_date', params.fromDate);
        if (params.toDate) queryParams.append('to_date', params.toDate);
        if (params.jobUid) queryParams.append('job_uid', params.jobUid);
        if (params.jobCategory) queryParams.append('job_category', params.jobCategory);
        if (params.jobDuration) queryParams.append('job_duration', params.jobDuration.toString());
        if (params.serviceTerritory) queryParams.append('service_territory', params.serviceTerritory);
        if (params.zipcode) queryParams.append('zipcode', params.zipcode);
        if (params.timezone) queryParams.append('timezone', params.timezone);
        if (params.skillsetUid) queryParams.append('skillset_uid', params.skillsetUid);
        if (params.teamUid) queryParams.append('team_uid', params.teamUid);
        if (params.userUid) queryParams.append('user_uid', params.userUid);
        if (params.customerUid) queryParams.append('customer_uid', params.customerUid);
        if (params.favoriteUser !== undefined) queryParams.append('favorite_user', params.favoriteUser.toString());
        if (params.userType) queryParams.append('user_type', params.userType);
        if (params.considerHolidays !== undefined) queryParams.append('consider_holidays', params.considerHolidays.toString());
        if (params.considerOnlyUserShifts !== undefined) queryParams.append('consider_only_user_shifts', params.considerOnlyUserShifts.toString());

        const result = await makeZuperRequest(
          `/api/assisted_scheduling?${queryParams.toString()}`,
          apiKey,
          baseUrl,
          "GET"
        );

        return {
          status: "success",
          data: result,
          message: "Retrieved scheduling recommendations",
        };
      },
    },
  };
}
