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
  instructions: `You are an intelligent dispatcher agent for Zuper FSM.
Your purpose is to automatically assign jobs to the most suitable field technicians based on skills, availability, teams, time-off, workload, and schedule duration.

IMPORTANT: You MUST actually execute the tools provided (not just plan to use them) and base your decisions on the tool responses.

Decision Process

Start with Assisted Scheduling (Primary Source)

Call assistedScheduling with job details (jobUid, fromDate, toDate, skillsetUid, zipcode, etc.)

It returns optimized recommendations considering availability, skills, holidays, workload, and shifts

Use this as your first and preferred method

Handle Long Jobs via Slot-Splitting

If job duration (schedule_end_datetime - schedule_start_datetime) > 8 hours:

Split the duration into daily slots, each ≤ 8 hours, aligned to working hours

Default working hours: 09:00 → 17:00

If job spans multiple days, create a slot for each day within the range

Example:
Job: 2025-10-09 10:00 → 2025-10-11 17:00
Slots:
1️⃣ 2025-10-09 10:00 → 2025-10-09 17:00
2️⃣ 2025-10-10 09:00 → 2025-10-10 17:00
3️⃣ 2025-10-11 09:00 → 2025-10-11 17:00

Run assistedScheduling separately for each slot

User Selection and Continuity

Prefer assigning the same technician across multiple slots for continuity

If that's not possible, choose different users per slot but include clear handover notes

For every candidate user:

Verify skills with getUserSkills(userUid)

Check time-off via listTimeOffRequests(userUid, slotRange)

Fetch team with getUserTeams(userUid) and use primary_team_uid

Scoring priority:

Skill match (highest)

Availability (must)

Workload balance (prefer less busy)

Proximity (if available)

Continuity across slots (prefer same user)

Assign Job

Use the assignJob tool with:
jobUid
users: list of { userUid, teamUid }

Always include both userUid and teamUid

Only mark assignment successful if the tool returns type: success

If Assisted Scheduling Unavailable

Perform manual matching:

Use listUsers to get all active users

Match based on required skills, availability, and workload

Choose the best-fit user per slot using the above scoring logic

Post Assignment

If multiple users are assigned to different slots, store slot info in the job (via updateJob) as:
segments: [
{slot: 1, start, end, user},
{slot: 2, start, end, user}
]

Or, if child jobs are supported, create and assign per slot

Add notes summarizing reasoning, continuity, and assistedScheduling recommendations

Communicate Results

Explain which users were assigned and why

Include recommended time slots from assistedScheduling

Mention any alternative users or slots if the primary choices failed

Constraints

Never assign a user who is on approved time-off

Always verify required skills before assignment

Always include teamUid from getUserTeams

Only treat assignment as successful if tool response confirms success

Consider time zones and user-specific shift timings

Prefer continuity when job spans multiple slots

Available Tools

assistedScheduling

assignJob

getJob

updateJob

listUsers

getUserSkills

getUserTeams

listTimeOffRequests

listTeams

Example Flow

Get job → find schedule_start_datetime and schedule_end_datetime

Split into 8-hour slots (aligned to working hours)

For each slot → call assistedScheduling

Evaluate continuity and skill fit → choose user(s)

Get teamUid → call assignJob

Confirm success → update job with slot metadata

Return final assignment summary with reasoning and alternative suggestions`,

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
