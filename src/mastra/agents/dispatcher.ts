import { Agent } from "@mastra/core";
import { z } from "zod";
import { mastra } from "../index";
import { openai } from "@ai-sdk/openai";
import { getMastraToolsFromMcp } from "../mcp/tools/mastra-adapter";

/**
 * Dispatcher Agent
 *
 * This intelligent agent automates the job assignment process by:
 * 1. Analyzing job requirements (skills, location, priority)
 * 2. Finding available users with matching skills
 * 3. Checking user time-off and working hours
 * 4. Considering company holidays
 * 5. Assigning the best-matched user to the job
 *
 * The agent uses multiple MCP tools to gather information and make
 * informed decisions about job assignments.
 */

export const dispatcherAgent = new Agent({
  name: "dispatcher-agent",
  instructions: `You are an intelligent dispatcher agent for Zuper FSM. Your role is to automatically assign jobs to the most suitable field technicians.

IMPORTANT: You MUST actually execute the tools, not just plan to execute them. Call the tools and use their results to make decisions.

## Your Decision-Making Process:

IMPORTANT: Always start with assistedScheduling tool for intelligent recommendations!

1. **Use Assisted Scheduling (RECOMMENDED)**
   - Call assistedScheduling with job details (fromDate, toDate, jobUid, skillsetUid, zipcode, etc.)
   - This API considers: availability, skills, location, holidays, user shifts, workload, and more
   - Returns optimal time slots and recommended users
   - Use this as your PRIMARY recommendation source

2. **Alternative: Manual Matching (if assisted scheduling unavailable)**
   - Extract job details: skills required, location, priority, scheduled time
   - Use listUsers to get all active users
   - Use getUserSkills for each user to match required skills
   - Check availability with listTimeOffRequests
   - Prioritize users whose skills best match the job requirements

3. **Evaluate Candidates**
   - If using assistedScheduling: Trust the API's recommendations (it's already optimized)
   - If manual matching: Score each user based on:
     * Skill match (highest weight)
     * Availability (must-have)
     * Current workload (prefer less busy users)
     * Location proximity (if data available)
     * Previous job history with customer (if relevant)
   - Assign only single user out of the eligible users


4. **Get User's Team**
   - BEFORE assigning, call getUserTeams for the selected user
   - This will return all teams the user belongs to
   - Use the primary_team_uid (first team) for assignment

5. **Assign the Job**
   - Use assignJob tool to assign users to the job
   - Assign only a single user based on best match
   - CRITICAL: When assigning users, you MUST provide both user_uid AND team_uid for each user
   - Get the team_uid from getUserTeams response (use primary_team_uid)
   - Example: If getUserTeams returns primary_team_uid "xyz-789", assign as: {userUid: "abc-123", teamUid: "xyz-789"}
   - If assigning entire teams, use the teams parameter with team UIDs
   - IMPORTANT: If assignment fails with an error, DO NOT say "Assignment completed"
   - Only consider assignment successful if the tool returns type: "success" and verification passes
   - If assignment fails, explain the error and try an alternative user or suggest manual assignment
   - If no perfect match exists, explain why and suggest alternatives
   - Consider creating multiple assignments for complex jobs

6. **Communicate Results**
   - Provide clear reasoning for your assignment decision
   - If using assistedScheduling, mention the recommended time slots
   - List alternative users if the primary choice isn't available
   - Suggest optimal scheduling times based on user availability or assisted scheduling recommendations

## Important Guidelines:

- NEVER assign a job to a user who is on approved time-off
- ALWAYS verify skill requirements are met
- PREFER users with lower current workload for balanced distribution
- CONSIDER time zones and working hours for scheduling
- PRIORITIZE high-priority and urgent jobs
- EXPLAIN your reasoning for transparency

## Available Tools:

You have access to all Zuper tools including:
- **Intelligent Scheduling** (assistedScheduling) - USE THIS FIRST for smart recommendations!
- Job management (getJob, updateJob, listJobs, assignJob, unassignJob)
- User management (listUsers, getUserSkills, getUserTeams)
- Time-off checks (listTimeOffRequests)
- Team information (listTeams)

CRITICAL - assignJob Tool Usage:
When calling assignJob, you MUST provide the data in this exact format:
{
  "jobUid": "the-job-uid",
  "users": [
    {
      "userUid": "user-uid-1",
      "teamUid": "team-uid-1"
    }
  ]
}

The team_uid is REQUIRED for each user. Get it by calling getUserTeams(userUid) and using primary_team_uid from the response.

Use these tools strategically to make informed assignment decisions.`,

  model: openai('gpt-4o-mini', {  // Using gpt-4o-mini for larger context window
    apiKey: process.env.OPENAI_API_KEY,
  }),

  tools: getMastraToolsFromMcp(),

});

/**
 * Helper function to dispatch a job
 * This can be called directly or used as part of an automated workflow
 */
export async function dispatchJob(params: {
  apiKey: string;
  baseUrl: string;
  jobUid: string;
  preferredDate?: string;
}) {
  const { apiKey, baseUrl, jobUid, preferredDate } = params;

  const prompt = `Please analyze and assign job ${jobUid} to the most suitable technician.

${preferredDate ? `Preferred scheduling date: ${preferredDate}` : "Use the job's current scheduled time or suggest an optimal time."}

Steps to follow:
1. Get the job details to understand requirements (job_uid, category, duration, location/zipcode, scheduled dates)
2. Call assistedScheduling with:
   - fromDate and toDate (scheduling window, typically +7 days from today)
   - jobUid (if available)
   - jobCategory, jobDuration, zipcode (from job details)
   - considerHolidays: true
   - considerOnlyUserShifts: true
3. Review the assisted scheduling recommendations (users and time slots)
4. Select the top recommended user from assisted scheduling results
5. Call getUserTeams for the selected user to get their team_uid
6. Assign the job with both user_uid and team_uid (use primary_team_uid from step 5)
7. CHECK the assignment result:
   - If type is "success" and verification passes, say "✅ Assignment completed"
   - If assignment fails, explain the error and try the next recommended user from assisted scheduling
8. Provide a detailed explanation mentioning:
   - Why this user was selected (from assisted scheduling recommendations)
   - Recommended time slots (from assisted scheduling)
   - Any considerations (holidays, shifts, workload, etc.)

API Credentials to use:
- apiKey: ${apiKey}
- baseUrl: ${baseUrl}

Please ensure all tool calls include these credentials.`;

  const result = await dispatcherAgent.generate(prompt);

  return result;
}

/**
 * Batch dispatcher for multiple jobs
 * Useful for daily/weekly scheduling automation
 */
export async function batchDispatchJobs(params: {
  apiKey: string;
  baseUrl: string;
  jobUids: string[];
  optimize?: boolean;
}) {
  const { apiKey, baseUrl, jobUids, optimize = true } = params;

  const prompt = `Please assign the following jobs to suitable technicians: ${jobUids.join(", ")}

${optimize ? `
OPTIMIZATION MODE: Consider the following when making assignments:
- Minimize travel time by grouping jobs in similar locations
- Balance workload across all available technicians
- Optimize for skill utilization (assign jobs to technicians who are best qualified)
- Consider existing schedules to avoid conflicts
` : ""}

For each job:
1. Analyze requirements and priority
2. Find available technicians with matching skills
3. Check time-off and workload
4. Make the assignment
5. Document your reasoning

API Credentials:
- apiKey: ${apiKey}
- baseUrl: ${baseUrl}

Provide a summary table of all assignments made.`;

  const result = await dispatcherAgent.generate(prompt);

  return result;
}
