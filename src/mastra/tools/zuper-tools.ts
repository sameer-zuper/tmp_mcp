/**
 * Zuper FSM Tools for Mastra Agents
 *
 * These tools allow agents to interact with Zuper API
 */

import { createTool } from "@mastra/core";
import { z } from "zod";

// Default credentials from environment
const DEFAULT_ZUPER_API_KEY = process.env.ZUPER_API_KEY || "";
const DEFAULT_ZUPER_BASE_URL = process.env.ZUPER_BASE_URL || "";

async function makeZuperRequest(
  endpoint: string,
  apiKey: string,
  baseUrl: string,
  method: string = "GET",
  body?: any,
  logMessage?: string
) {
  const url = `${baseUrl}${endpoint}`;

  // User-friendly log message
  if (logMessage) {
    console.log(`\n📍 ${logMessage}...`);
  }

  const options: RequestInit = {
    method,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`   ❌ Error: ${errorText}`);
    throw new Error(`Zuper API error (${response.status}): ${errorText || response.statusText}`);
  }

  const result = await response.json();

  // Show success with data summary
  const dataCount = result?.data?.length || (result?.data ? 1 : 0);
  if (dataCount > 0) {
    console.log(`   ✅ Success: Retrieved ${dataCount} record(s)`);
  } else {
    console.log(`   ✅ Success`);
  }

  return result;
}

// Common parameter schema
const apiCredentialsSchema = z.object({
  apiKey: z.string().optional().describe("Zuper API key"),
  baseUrl: z.string().optional().describe("Zuper base URL"),
});

// Job Tools
export const getJobTool = createTool({
  id: "getJob",
  description: "Get details of a specific job",
  inputSchema: apiCredentialsSchema.extend({
    jobUid: z.string().describe("Job UID"),
  }),
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const jobUid = context?.jobUid;

    const result = await makeZuperRequest(
      `/api/jobs/${jobUid}`,
      apiKey,
      baseUrl,
      "GET",
      undefined,
      "Getting job details"
    );

    // Return only essential fields to avoid context overflow
    const job = result?.data;
    if (job) {
      return {
        type: "success",
        data: {
          job_uid: job.job_uid,
          job_title: job.job_title,
          job_description: job.plain_text_description || job.job_description?.substring(0, 200),
          job_priority: job.job_priority,
          due_date: job.due_date,
          current_status: job.current_job_status?.status_name,
          assigned_to: job.assigned_to || [],
          customer_name: `${job.customer?.customer_first_name || ''} ${job.customer?.customer_last_name || ''}`.trim(),
          job_category: job.job_category?.category_name,
        }
      };
    }
    return result;
  },
});

export const listJobsTool = createTool({
  id: "listJobs",
  description: "List all jobs",
  inputSchema: apiCredentialsSchema.extend({
    limit: z.number().optional().describe("Number of jobs to return"),
  }),
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const limit = context?.limit || 50;
    const result = await makeZuperRequest(
      `/api/jobs?limit=${limit}`,
      apiKey,
      baseUrl,
      "GET",
      undefined,
      "Getting all jobs to analyze workload"
    );
    return result;
  },
});

export const updateJobTool = createTool({
  id: "updateJob",
  description: "Update a job (including assigning users)",
  inputSchema: apiCredentialsSchema.extend({
    jobUid: z.string().describe("Job UID"),
    assignedUsers: z.array(z.string()).optional().describe("Array of user UIDs to assign"),
    status: z.string().optional().describe("Job status"),
  }),
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const jobUid = context?.jobUid;
    const { assignedUsers, status } = context || {};
    const updateData: any = {};
    if (assignedUsers) updateData.assignedUsers = assignedUsers;
    if (status) updateData.status = status;
    const result = await makeZuperRequest(
      `/api/jobs/${jobUid}`,
      apiKey,
      baseUrl,
      "PUT",
      updateData,
      "Updating job details"
    );
    return result;
  },
});

export const assignJobTool = createTool({
  id: "assignJob",
  description: "Assign technicians or teams to a job",
  inputSchema: apiCredentialsSchema.extend({
    jobUid: z.string().describe("Job UID to assign technicians/teams to"),
    users: z.array(z.object({
      userUid: z.string().describe("User UID"),
      teamUid: z.string().describe("Team UID the user belongs to"),
    })).optional().describe("Array of users to assign (each with user_uid and team_uid)"),
    teams: z.array(z.string()).optional().describe("Array of team UIDs to assign"),
    updateAllJobs: z.boolean().optional().describe("Whether to update all jobs (default: false)"),
    notifyUsers: z.boolean().optional().describe("Whether to notify users (default: false)"),
  }),
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const jobUid = context?.jobUid;
    const users = context?.users || [];
    const teams = context?.teams || [];
    const updateAllJobs = context?.updateAllJobs || false;
    const notifyUsers = context?.notifyUsers || false;

    console.log('\n[assignJob] Raw context received:', JSON.stringify(context, null, 2));

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

    console.log('[assignJob] Assignment payload:', JSON.stringify(assignmentData, null, 2));

    const itemCount = users.length + teams.length;

    try {
      const result = await makeZuperRequest(
        `/api/jobs/assign`,
        apiKey,
        baseUrl,
        "POST",
        assignmentData,
        `Assigning ${itemCount} user(s)/team(s) to job`
      );

      console.log('[assignJob] API Response:', JSON.stringify(result, null, 2));

      // Check if the API returned an error
      if (result.type === 'error') {
        console.error(`\n❌ Assignment failed: ${result.message || result.title}`);
        throw new Error(`Assignment failed: ${result.message || result.title || 'Unknown error'}`);
      }

      // Verify assignment by fetching the job
      console.log('\n📍 Verifying assignment...');
      const verifyResult = await makeZuperRequest(
        `/api/jobs/${jobUid}`,
        apiKey,
        baseUrl,
        "GET",
        undefined,
        "Verifying job assignment"
      );

      const assignedUsers = verifyResult?.data?.assigned_to || [];

      if (assignedUsers.length === 0) {
        console.error('❌ Verification failed: Job has no assigned users after assignment call');
        throw new Error('Assignment verification failed: No users assigned to the job');
      }

      console.log(`✅ Verification successful: Job now has ${assignedUsers.length} assigned user(s)`);

      return {
        type: 'success',
        message: `Successfully assigned ${itemCount} user(s)/team(s) to job ${jobUid}`,
        assigned_to: assignedUsers,
      };
    } catch (error: any) {
      console.error(`\n❌ Assignment error: ${error.message}`);
      throw error;
    }
  },
});

export const unassignJobTool = createTool({
  id: "unassignJob",
  description: "Unassign technicians or teams from a job",
  inputSchema: apiCredentialsSchema.extend({
    jobUid: z.string().describe("Job UID to unassign technicians/teams from"),
    users: z.array(z.object({
      userUid: z.string().describe("User UID"),
      teamUid: z.string().describe("Team UID the user belongs to"),
    })).optional().describe("Array of users to unassign (each with user_uid and team_uid)"),
    teams: z.array(z.string()).optional().describe("Array of team UIDs to unassign"),
    updateAllJobs: z.boolean().optional().describe("Whether to update all jobs (default: false)"),
    notifyUsers: z.boolean().optional().describe("Whether to notify users (default: false)"),
  }),
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const jobUid = context?.jobUid;
    const users = context?.users || [];
    const teams = context?.teams || [];
    const updateAllJobs = context?.updateAllJobs || false;
    const notifyUsers = context?.notifyUsers || false;

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

    const itemCount = users.length + teams.length;
    const result = await makeZuperRequest(
      `/api/jobs/assign`,
      apiKey,
      baseUrl,
      "POST",
      assignmentData,
      `Unassigning ${itemCount} user(s)/team(s) from job`
    );
    return result;
  },
});

// User Tools
export const listUsersTool = createTool({
  id: "listUsers",
  description: "List all users/technicians",
  inputSchema: apiCredentialsSchema,
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const result = await makeZuperRequest(
      "/api/user/all",
      apiKey,
      baseUrl,
      "GET",
      undefined,
      "Getting list of available technicians"
    );

    // Return only essential fields to reduce context size
    const users = result?.data || [];
    return {
      type: "success",
      data: users.map((user: any) => ({
        user_uid: user.user_uid,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        mobile: user.mobile_phone_number,
        is_active: user.is_active,
        team_uid: user.team_uid || user.team?.team_uid,  // Include team_uid for job assignment
      }))
    };
  },
});

export const getUserSkillsTool = createTool({
  id: "getUserSkills",
  description: "Get skills for a specific user",
  inputSchema: apiCredentialsSchema.extend({
    userUid: z.string().describe("User UID"),
  }),
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const userUid = context?.userUid;
    const result = await makeZuperRequest(
      `/api/users/${userUid}/skill`,
      apiKey,
      baseUrl,
      "GET",
      undefined,
      "Checking technician skills"
    );
    return result;
  },
});

export const getUserTeamsTool = createTool({
  id: "getUserTeams",
  description: "Get all teams that a user belongs to. Use this to find the team_uid needed for job assignment.",
  inputSchema: apiCredentialsSchema.extend({
    userUid: z.string().describe("User UID"),
  }),
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const userUid = context?.userUid;
    const result = await makeZuperRequest(
      `/api/user/${userUid}/teams`,
      apiKey,
      baseUrl,
      "GET",
      undefined,
      "Getting user's team memberships"
    );

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
});

// Time-off Tools
export const listTimeOffRequestsTool = createTool({
  id: "listTimeOffRequests",
  description: "List time-off requests for a specific date range to check user availability. Filter by job's scheduled date.",
  inputSchema: apiCredentialsSchema.extend({
    fromDate: z.string().optional().describe("From date to check (YYYY-MM-DD format). Typically the job's scheduled start date."),
    toDate: z.string().optional().describe("To date to check (YYYY-MM-DD format). Typically the job's scheduled end date."),
    userUid: z.string().optional().describe("Filter by specific user UID"),
    teamUid: z.string().optional().describe("Filter by specific team UID"),
  }),
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const fromDate = context?.fromDate;
    const toDate = context?.toDate;
    const userUid = context?.userUid;
    const teamUid = context?.teamUid;

    // Build query params with correct filter format
    const queryParams = new URLSearchParams();
    if (fromDate) queryParams.append('filter.from_date', fromDate);
    if (toDate) queryParams.append('filter.to_date', toDate);
    if (userUid) queryParams.append('filter.user_uid', userUid);
    if (teamUid) queryParams.append('filter.team_uid', teamUid);

    const endpoint = `/api/timesheets/request/timeoff${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const result = await makeZuperRequest(
      endpoint,
      apiKey,
      baseUrl,
      "GET",
      undefined,
      fromDate && toDate
        ? `Checking time-off requests between ${fromDate} and ${toDate}`
        : "Checking time-off requests for availability"
    );

    // Return only essential fields
    const requests = result?.data || [];

    console.log(`   ℹ️  Found ${requests.length} time-off request(s) in the specified period`);

    return {
      status: "success",
      data: requests.map((req: any) => ({
        user_uid: req.user?.user_uid,
        user_name: `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim(),
        request_from: req.request_from,
        request_to: req.request_to,
        status: req.status,
      }))
    };
  },
});

// Scheduling Tools
export const assistedSchedulingTool = createTool({
  id: "assistedScheduling",
  description: "Get intelligent scheduling recommendations based on availability, skills, location, and other factors. Returns optimal time slots and user suggestions for a job.",
  inputSchema: apiCredentialsSchema.extend({
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
    favoriteUser: z.boolean().optional().default(false).describe("Prioritize customer's favorite users"),
    userType: z.string().optional().describe("User type filter"),
    considerHolidays: z.boolean().optional().default(false).describe("Consider company holidays in scheduling"),
    considerOnlyUserShifts: z.boolean().optional().default(false).describe("Only schedule during user's defined shifts"),
  }),
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;

    // Build query params
    const queryParams = new URLSearchParams();
    if (context?.fromDate) queryParams.append('from_date', context.fromDate);
    if (context?.toDate) queryParams.append('to_date', context.toDate);
    if (context?.jobUid) queryParams.append('job_uid', context.jobUid);
    if (context?.jobCategory) queryParams.append('job_category', context.jobCategory);
    if (context?.jobDuration) queryParams.append('job_duration', context.jobDuration.toString());
    if (context?.serviceTerritory) queryParams.append('service_territory', context.serviceTerritory);
    if (context?.zipcode) queryParams.append('zipcode', context.zipcode);
    if (context?.timezone) queryParams.append('timezone', context.timezone);
    if (context?.skillsetUid) queryParams.append('skillset_uid', context.skillsetUid);
    if (context?.teamUid) queryParams.append('team_uid', context.teamUid);
    if (context?.userUid) queryParams.append('user_uid', context.userUid);
    if (context?.customerUid) queryParams.append('customer_uid', context.customerUid);
    if (context?.favoriteUser !== undefined) queryParams.append('favorite_user', context.favoriteUser.toString());
    if (context?.userType) queryParams.append('user_type', context.userType);
    if (context?.considerHolidays !== undefined) queryParams.append('consider_holidays', context.considerHolidays.toString());
    if (context?.considerOnlyUserShifts !== undefined) queryParams.append('consider_only_user_shifts', context.considerOnlyUserShifts.toString());

    const result = await makeZuperRequest(
      `/api/assisted_scheduling?${queryParams.toString()}`,
      apiKey,
      baseUrl,
      "GET",
      undefined,
      "Getting intelligent scheduling recommendations"
    );

    console.log(`   ℹ️  Found scheduling recommendations`);

    return {
      type: "success",
      data: result.data,
    };
  },
});

// Team Tools
export const listTeamsTool = createTool({
  id: "listTeams",
  description: "List all teams with their members. Use this to find which team a user belongs to for job assignment.",
  inputSchema: apiCredentialsSchema,
  execute: async (params) => {
    const { context } = params || {};
    const apiKey = context?.apiKey || DEFAULT_ZUPER_API_KEY;
    const baseUrl = context?.baseUrl || DEFAULT_ZUPER_BASE_URL;
    const result = await makeZuperRequest(
      "/api/team",
      apiKey,
      baseUrl,
      "GET",
      undefined,
      "Getting team information with member mappings"
    );

    // Build a user-to-team mapping for easy lookup
    const teams = result?.data || [];
    const userTeamMap: Record<string, string> = {};

    teams.forEach((team: any) => {
      if (team.users && Array.isArray(team.users)) {
        team.users.forEach((user: any) => {
          userTeamMap[user.user_uid] = team.team_uid;
        });
      }
    });

    return {
      type: "success",
      data: teams.map((team: any) => ({
        team_uid: team.team_uid,
        team_name: team.team_name,
        user_uids: team.users?.map((u: any) => u.user_uid) || [],
      })),
      user_team_mapping: userTeamMap, // Helpful for quick lookup
    };
  },
});

// Export all tools as an object for easy agent registration
export const zuperTools = {
  getJob: getJobTool,
  listJobs: listJobsTool,
  updateJob: updateJobTool,
  assignJob: assignJobTool,
  unassignJob: unassignJobTool,
  listUsers: listUsersTool,
  getUserSkills: getUserSkillsTool,
  getUserTeams: getUserTeamsTool,
  listTimeOffRequests: listTimeOffRequestsTool,
  assistedScheduling: assistedSchedulingTool,
  listTeams: listTeamsTool,
};
