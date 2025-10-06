/**
 * Standalone Dispatcher Script
 *
 * This script demonstrates how to use the Dispatcher Agent
 * to automatically assign jobs to the best-matched technicians.
 *
 * You can use this pattern in your webapp/mobile app.
 */

// Load environment variables from .env file
import 'dotenv/config';

import { dispatchJob, batchDispatchJobs } from './src/mastra/agents/dispatcher';

// Configuration - In your webapp, these will come from user session/auth
const config = {
  apiKey: process.env.ZUPER_API_KEY || "59ed3a6f230c1803317a4974597edc33",
  baseUrl: process.env.ZUPER_BASE_URL || "https://eks-staging.zuperpro.com",
};

/**
 * Example 1: Assign a single job
 */
async function assignSingleJob(jobUid: string) {
  console.log("🎯 Assigning single job:", jobUid);
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    const result = await dispatchJob({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      jobUid: jobUid,
      // preferredDate: "2025-10-05", // Optional: specify preferred date
    });

    console.log("✅ Assignment completed!");
    console.log("\n📋 Agent's Analysis:");
    console.log(result.text);

    return result;
  } catch (error) {
    console.error("❌ Assignment failed:", error);
    throw error;
  }
}

/**
 * Example 2: Assign multiple jobs at once (batch mode)
 */
async function assignMultipleJobs(jobUids: string[]) {
  console.log("🎯 Assigning multiple jobs:", jobUids.length, "jobs");
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    const result = await batchDispatchJobs({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      jobUids: jobUids,
      optimize: true, // Enable workload balancing and route optimization
    });

    console.log("✅ Batch assignment completed!");
    console.log("\n📋 Agent's Summary:");
    console.log(result.text);

    return result;
  } catch (error) {
    console.error("❌ Batch assignment failed:", error);
    throw error;
  }
}

/**
 * Example 3: Get unassigned jobs and auto-assign them
 */
async function autoAssignUnassignedJobs() {
  console.log("🤖 Auto-assigning all unassigned jobs");
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // Fetch unassigned jobs from API
    const response = await fetch(`${config.baseUrl}/api/jobs?limit=50`, {
      headers: {
        "x-api-key": config.apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    const jobs = data.data || [];

    // Filter unassigned jobs
    const unassignedJobs = jobs.filter(
      (job: any) => !job.assigned_users || job.assigned_users.length === 0
    );

    console.log(`📊 Found ${jobs.length} total jobs`);
    console.log(`📋 Unassigned jobs: ${unassignedJobs.length}\n`);

    if (unassignedJobs.length === 0) {
      console.log("✅ No unassigned jobs found!");
      return;
    }

    // Show what we'll assign
    console.log("Jobs to be assigned:");
    unassignedJobs.forEach((job: any, index: number) => {
      console.log(`  ${index + 1}. ${job.job_title || job.job_uid} (Priority: ${job.priority || 'normal'})`);
    });
    console.log();

    // Assign them in batch
    const jobUids = unassignedJobs.map((job: any) => job.job_uid);

    if (jobUids.length === 1) {
      // Single job - use direct assignment
      return await assignSingleJob(jobUids[0]);
    } else {
      // Multiple jobs - use batch assignment
      return await assignMultipleJobs(jobUids);
    }

  } catch (error) {
    console.error("❌ Auto-assignment failed:", error);
    throw error;
  }
}

/**
 * Example 4: Assign job with specific requirements/preferences
 */
async function assignJobWithPreferences(
  jobUid: string,
  preferences: {
    preferredTechnician?: string;
    preferredDate?: string;
    requiredSkills?: string[];
    maxWorkload?: number;
  }
) {
  console.log("🎯 Assigning job with preferences:", jobUid);
  console.log("Preferences:", preferences);
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // Build custom prompt with preferences
    const { dispatcherAgent } = await import('./src/mastra/agents/dispatcher');

    let preferencesText = '';
    if (preferences.preferredTechnician) {
      preferencesText += `\n- PREFER technician: ${preferences.preferredTechnician}`;
    }
    if (preferences.requiredSkills && preferences.requiredSkills.length > 0) {
      preferencesText += `\n- REQUIRED skills: ${preferences.requiredSkills.join(', ')}`;
    }
    if (preferences.maxWorkload) {
      preferencesText += `\n- ONLY assign to technicians with less than ${preferences.maxWorkload} current jobs`;
    }

    const prompt = `Please analyze and assign job ${jobUid} considering these preferences:${preferencesText}

${preferences.preferredDate ? `Preferred date: ${preferences.preferredDate}` : ''}

Steps:
1. Get job details
2. List available users
3. Check skills, time-off, and workload
4. Apply the preferences above
5. Make the best assignment
6. Explain your reasoning

API Credentials:
- apiKey: ${config.apiKey}
- baseUrl: ${config.baseUrl}`;

    const result = await dispatcherAgent.generate(prompt);

    console.log("✅ Assignment with preferences completed!");
    console.log("\n📋 Agent's Analysis:");
    console.log(result.text);

    return result;
  } catch (error) {
    console.error("❌ Assignment failed:", error);
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION - Choose which example to run
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  console.log("\n🤖 ZUPER FSM DISPATCHER AGENT");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`Environment: ${config.baseUrl}`);
  console.log(`API Key: ${config.apiKey.substring(0, 8)}...`);
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    switch (command) {
      case 'single':
        // Example: npm run dispatch single <job-uid>
        const jobUid = args[1];
        if (!jobUid) {
          console.error("❌ Please provide a job UID");
          console.log("Usage: npx tsx dispatch-job-example.ts single <job-uid>");
          process.exit(1);
        }
        await assignSingleJob(jobUid);
        break;

      case 'batch':
        // Example: npm run dispatch batch <job-uid-1> <job-uid-2> ...
        const jobUids = args.slice(1);
        if (jobUids.length === 0) {
          console.error("❌ Please provide at least one job UID");
          console.log("Usage: npx tsx dispatch-job-example.ts batch <job-uid-1> <job-uid-2> ...");
          process.exit(1);
        }
        await assignMultipleJobs(jobUids);
        break;

      case 'auto':
        // Example: npm run dispatch auto
        await autoAssignUnassignedJobs();
        break;

      case 'preferences':
        // Example: npm run dispatch preferences <job-uid>
        const jobId = args[1];
        if (!jobId) {
          console.error("❌ Please provide a job UID");
          process.exit(1);
        }
        await assignJobWithPreferences(jobId, {
          preferredDate: "2025-10-05",
          requiredSkills: ["plumbing", "electrical"],
          maxWorkload: 5,
        });
        break;

      case 'help':
      default:
        console.log("📚 Available Commands:\n");
        console.log("  single <job-uid>");
        console.log("    Assign a single job to the best technician");
        console.log("    Example: npx tsx dispatch-job-example.ts single job-123\n");

        console.log("  batch <job-uid-1> <job-uid-2> ...");
        console.log("    Assign multiple jobs with workload optimization");
        console.log("    Example: npx tsx dispatch-job-example.ts batch job-1 job-2 job-3\n");

        console.log("  auto");
        console.log("    Find all unassigned jobs and auto-assign them");
        console.log("    Example: npx tsx dispatch-job-example.ts auto\n");

        console.log("  preferences <job-uid>");
        console.log("    Assign with specific preferences (skills, date, workload)");
        console.log("    Example: npx tsx dispatch-job-example.ts preferences job-123\n");

        console.log("\n💡 For Webapp Integration:\n");
        console.log("  import { dispatchJob } from './src/mastra/agents/dispatcher';");
        console.log("  ");
        console.log("  const result = await dispatchJob({");
        console.log("    apiKey: userSession.apiKey,");
        console.log("    baseUrl: userSession.baseUrl,");
        console.log("    jobUid: selectedJobId");
        console.log("  });");
        break;
    }

    console.log("\n✅ Script completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
main();

// Export for use in other modules
export {
  assignSingleJob,
  assignMultipleJobs,
  autoAssignUnassignedJobs,
  assignJobWithPreferences,
};
