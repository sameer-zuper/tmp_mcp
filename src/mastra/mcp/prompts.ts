import type { MCPServerPrompts, Prompt, PromptArgument, PromptMessage } from "@mastra/mcp";

// Define all available prompts with their metadata
const promptDefinitions: Record<string, { description: string; arguments?: PromptArgument[] }> = {
  "create-job": {
    description: "Generate a prompt to create a new job/work order in Zuper FSM",
    arguments: [
      { name: "customerName", description: "Name of the customer", required: true },
      { name: "jobType", description: "Type of job (e.g., repair, installation, maintenance)", required: true },
      { name: "priority", description: "Priority level (low, medium, high, urgent)", required: false },
    ],
  },
  "generate-invoice": {
    description: "Generate an invoice for a completed job",
    arguments: [{ name: "jobId", description: "UID of the job to generate invoice for", required: true }],
  },
  "daily-summary": {
    description: "Generate a summary of jobs for today",
    arguments: [],
  },
  "customer-overview": {
    description: "Generate a comprehensive overview of a specific customer",
    arguments: [{ name: "customerId", description: "UID of the customer or customer name", required: true }],
  },
  "optimize-schedule": {
    description: "Optimize technician schedules and job assignments",
    arguments: [{ name: "date", description: "Date to optimize (YYYY-MM-DD format)", required: false }],
  },
  "invoice-followup": {
    description: "Generate follow-up actions for overdue invoices",
    arguments: [],
  },
  "contract-review": {
    description: "Review and analyze service contracts",
    arguments: [{ name: "customerId", description: "Filter by specific customer (optional)", required: false }],
  },
  "performance-metrics": {
    description: "Generate performance metrics and KPIs for field service operations",
    arguments: [{ name: "period", description: "Time period (today, week, month, quarter)", required: false }],
  },
  "smart-dispatch": {
    description: "Intelligently assign a job to the best available technician",
    arguments: [
      { name: "jobId", description: "UID of the job to assign", required: true },
      { name: "priorityLevel", description: "Priority level (urgent assignments may override normal rules)", required: false },
    ],
  },
  "check-availability": {
    description: "Check technician availability for a specific date range",
    arguments: [
      { name: "userIds", description: "Comma-separated list of user UIDs to check", required: false },
      { name: "startDate", description: "Start date (ISO 8601)", required: true },
      { name: "endDate", description: "End date (ISO 8601)", required: true },
    ],
  },
  "balance-workload": {
    description: "Analyze and balance workload across technicians",
    arguments: [
      { name: "teamId", description: "Specific team to analyze (optional)", required: false },
      { name: "dateRange", description: "Date range for analysis (e.g., 'this week', 'next month')", required: false },
    ],
  },
  "skill-gap-analysis": {
    description: "Analyze skill coverage and identify gaps in the team",
    arguments: [{ name: "teamId", description: "Specific team to analyze (optional)", required: false }],
  },
};

export const prompts: MCPServerPrompts = {
  // List all available prompts
  listPrompts: async () => {
    return Object.entries(promptDefinitions).map(
      ([name, def]): Prompt => ({
        name,
        description: def.description,
        arguments: def.arguments,
      })
    );
  },

  // Get messages for a specific prompt
  getPromptMessages: async ({ params }) => {
    const { name, arguments: args = {} } = params;

    switch (name) {
      case "create-job": {
        const { customerName, jobType, priority } = args as { customerName: string; jobType: string; priority?: string };
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Create a new ${jobType} job for customer ${customerName}${priority ? ` with ${priority} priority` : ""}.

First, search for the customer by name to get their UID. If the customer doesn't exist, create a new customer record first.

Then create a job with:
- Appropriate job title and description for ${jobType}
- Customer UID
- Priority: ${priority || "medium"}
- Schedule it for the next available time slot

Provide a summary of the created job including job ID, scheduled time, and assigned technician if any.`,
              },
            },
          ],
        };
      }

      case "generate-invoice": {
        const { jobId } = args as { jobId: string };
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Generate an invoice for job ${jobId}.

Steps:
1. Retrieve the job details to get customer UID, services performed, and costs
2. Calculate the total amount including any taxes
3. Create an invoice with:
   - Customer UID from the job
   - Job UID
   - Line items for all services and parts used
   - Current date as invoice date
   - Due date 30 days from now
   - Any applicable notes or terms

Provide a summary of the created invoice including invoice number and total amount.`,
              },
            },
          ],
        };
      }

      case "daily-summary": {
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Generate a daily summary for today's jobs in Zuper FSM.

Include:
1. Total number of scheduled jobs for today
2. Jobs by status (scheduled, in progress, completed)
3. High priority or urgent jobs that need attention
4. Any overdue jobs from previous days
5. Summary of completed jobs
6. Technician utilization and assignments

Format the summary in a clear, actionable format for field service management.`,
              },
            },
          ],
        };
      }

      case "customer-overview": {
        const { customerId } = args as { customerId: string };
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Generate a comprehensive overview for customer ${customerId}.

Include:
1. Customer details (name, contact info, properties)
2. Service history (all jobs, completed vs pending)
3. Financial summary (invoices, payments, outstanding balance)
4. Properties and assets associated with this customer
5. Recent activities and interactions
6. Any service contracts or recurring jobs

Provide actionable insights and recommendations based on the customer's history.`,
              },
            },
          ],
        };
      }

      case "optimize-schedule": {
        const { date } = args as { date?: string };
        const targetDate = date || "today";
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Analyze and optimize the job schedule for ${targetDate}.

Analysis should include:
1. List all scheduled jobs for ${targetDate}
2. Identify scheduling conflicts or gaps
3. Group jobs by geographic location for route optimization
4. Match job requirements with technician skills and availability
5. Suggest reassignments to balance workload
6. Highlight any high-priority jobs that need immediate attention

Provide specific recommendations for schedule optimization with reasoning.`,
              },
            },
          ],
        };
      }

      case "invoice-followup": {
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Generate a report of overdue invoices and follow-up actions.

Include:
1. List all overdue invoices with customer names and amounts
2. Age of each overdue invoice (days past due)
3. Customer contact information for follow-up
4. Payment history and patterns for each customer
5. Suggested follow-up actions and priority level
6. Total outstanding amount

Format as an actionable follow-up plan for the accounts team.`,
              },
            },
          ],
        };
      }

      case "contract-review": {
        const { customerId } = args as { customerId?: string };
        const filter = customerId ? `for customer ${customerId}` : "for all customers";
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Review service contracts ${filter}.

Analysis should include:
1. Active service contracts and their terms
2. Contracts expiring soon (within 30 days)
3. Utilization rate (services used vs contract allowance)
4. Revenue from service contracts
5. Renewal opportunities
6. Contracts that may need attention or renegotiation

Provide recommendations for contract management and renewal strategies.`,
              },
            },
          ],
        };
      }

      case "performance-metrics": {
        const { period } = args as { period?: string };
        const timePeriod = period || "this month";
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Generate performance metrics and KPIs for ${timePeriod}.

Metrics to include:
1. Job completion rate and average completion time
2. First-time fix rate
3. Customer satisfaction indicators
4. Technician productivity and utilization
5. Revenue metrics (invoiced vs collected)
6. Response time to service requests
7. Schedule adherence rate
8. Job backlog and aging

Provide insights and trends with recommendations for improvement.`,
              },
            },
          ],
        };
      }

      case "smart-dispatch": {
        const { jobId, priorityLevel } = args as { jobId: string; priorityLevel?: string };
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Assign job ${jobId} to the best available technician using intelligent dispatching.

${priorityLevel === "urgent" ? "⚠️ URGENT: This is a high-priority assignment. Consider emergency protocols." : ""}

Decision Process:
1. Get job details (skills required, location, scheduled time)
2. List all active users/technicians
3. For top candidates, check:
   - Matching skills (use getUserSkills)
   - Time-off status (use checkTimeOffAvailability)
   - Current workload (use listJobs filtered by assigned user)
   - Working hours (use getTimesheetSummary if needed)
4. Score each candidate based on:
   - Skill match (40% weight)
   - Availability (30% weight)
   - Workload balance (20% weight)
   - Location proximity (10% weight)
5. Select the best match and use updateJob to assign
6. Explain your decision with reasoning

Provide the assigned technician's UID and a summary of why they were chosen.`,
              },
            },
          ],
        };
      }

      case "check-availability": {
        const { userIds, startDate, endDate } = args as { userIds?: string; startDate: string; endDate: string };
        const userFilter = userIds ? `for users: ${userIds}` : "for all active users";
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Check technician availability ${userFilter} from ${startDate} to ${endDate}.

Steps:
1. ${userIds ? "Get details for specified users" : "List all active users"}
2. For each user, check:
   - Time-off requests (use listTimeOffRequests with date filters)
   - Scheduled jobs (use listJobs to see existing assignments)
   - Working hours (use listTimesheets for the date range)
3. Calculate availability percentage for each user
4. Identify fully available vs partially available technicians
5. Flag any users on leave or with heavy workloads

Provide:
- Availability status for each user
- Number of open slots (available hours)
- Recommended users for new job assignments
- Any scheduling conflicts or concerns`,
              },
            },
          ],
        };
      }

      case "balance-workload": {
        const { teamId, dateRange } = args as { teamId?: string; dateRange?: string };
        const scope = teamId ? `for team ${teamId}` : "across all teams";
        const period = dateRange || "for the upcoming week";
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Analyze and balance workload ${scope} ${period}.

Analysis Steps:
1. Get all active users ${teamId ? `in team ${teamId}` : ""}
2. For each user, count:
   - Scheduled jobs
   - In-progress jobs
   - Total estimated hours
3. Identify overloaded users (>40 hours/week)
4. Identify underutilized users (<20 hours/week)
5. Get list of unassigned jobs
6. Recommend reassignments for better balance

Provide:
- Workload distribution chart/summary
- Overloaded technicians (suggest redistributing jobs)
- Underutilized technicians (suggest new assignments)
- Specific job reassignment recommendations
- Expected outcome after rebalancing

If implementing changes, use updateJob to reassign jobs accordingly.`,
              },
            },
          ],
        };
      }

      case "skill-gap-analysis": {
        const { teamId } = args as { teamId?: string };
        const scope = teamId ? `for team ${teamId}` : "organization-wide";
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Perform skill gap analysis ${scope}.

Analysis Process:
1. List all users ${teamId ? `in team ${teamId}` : ""}
2. For each user, get their skills (use getUserSkills)
3. Analyze recent jobs to identify required skills (use listJobs)
4. Compare available skills vs. required skills
5. Identify:
   - Skills with single point of failure (only one user has it)
   - Skills with high demand but low supply
   - Skills that are overstaffed
   - Missing skills (required but no one has them)

Provide:
- Skill inventory matrix (users × skills)
- Critical skill gaps that need attention
- Training recommendations for existing team members
- Hiring recommendations for missing skills
- Risk assessment for single points of failure

This helps with strategic workforce planning and training initiatives.`,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  },
};
