/**
 * Webapp Integration Example
 *
 * This shows exactly how to integrate the Dispatcher Agent
 * into your webapp or mobile app.
 */

// Load environment variables from .env file
import 'dotenv/config';

import { dispatchJob } from './src/mastra/agents/dispatcher';

// ============================================================================
// EXAMPLE 1: Simple Integration (Express.js API endpoint)
// ============================================================================

/**
 * POST /api/jobs/:jobId/assign
 *
 * Automatically assign a job to the best available technician
 */
async function handleJobAssignment(req: any, res: any) {
  try {
    // Get API key from authenticated user session
    const userApiKey = req.user.apiKey;  // Your auth middleware provides this
    const userBaseUrl = req.user.baseUrl; // User's company base URL
    const jobId = req.params.jobId;

    // Call the dispatcher agent
    const result = await dispatchJob({
      apiKey: userApiKey,
      baseUrl: userBaseUrl,
      jobUid: jobId,
    });

    // Return the assignment result to frontend
    res.json({
      success: true,
      assignment: result.text,
      message: "Job assigned successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// EXAMPLE 2: React/Next.js Frontend Component
// ============================================================================

/**
 * React Component Example
 */
const JobAssignmentButton = `
import { useState } from 'react';

function AssignJobButton({ jobId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAssign = async () => {
    setLoading(true);

    try {
      // Call your backend API
      const response = await fetch(\`/api/jobs/\${jobId}/assign\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('token')}\`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setResult(data);
      alert('Job assigned successfully!');

    } catch (error) {
      alert('Failed to assign job: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleAssign} disabled={loading}>
      {loading ? 'Assigning...' : 'Auto-Assign Technician'}
    </button>
  );
}
`;

// ============================================================================
// EXAMPLE 3: Direct Usage (No Backend)
// ============================================================================

/**
 * If you want to call the dispatcher directly from your frontend
 * (not recommended for production - better to use backend API)
 */
async function directFrontendUsage() {
  const userApiKey = localStorage.getItem('zuper_api_key');
  const userBaseUrl = localStorage.getItem('zuper_base_url');
  const selectedJobId = 'job-123';

  try {
    const result = await dispatchJob({
      apiKey: userApiKey!,
      baseUrl: userBaseUrl!,
      jobUid: selectedJobId,
    });

    console.log('Assignment result:', result.text);
    return result;

  } catch (error) {
    console.error('Assignment failed:', error);
    throw error;
  }
}

// ============================================================================
// EXAMPLE 4: Batch Assignment (for admin dashboards)
// ============================================================================

import { batchDispatchJobs } from './src/mastra/agents/dispatcher';

/**
 * POST /api/jobs/batch-assign
 *
 * Assign multiple jobs at once with optimization
 */
async function handleBatchAssignment(req: any, res: any) {
  try {
    const userApiKey = req.user.apiKey;
    const userBaseUrl = req.user.baseUrl;
    const jobIds = req.body.jobIds; // Array of job UIDs

    const result = await batchDispatchJobs({
      apiKey: userApiKey,
      baseUrl: userBaseUrl,
      jobUids: jobIds,
      optimize: true, // Enable workload balancing
    });

    res.json({
      success: true,
      assignments: result.text,
      message: `${jobIds.length} jobs assigned successfully`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ============================================================================
// EXAMPLE 5: Scheduled Auto-Assignment (Cron Job)
// ============================================================================

/**
 * Run this daily to auto-assign all unassigned jobs
 * Add to your cron jobs or task scheduler
 */
async function dailyAutoAssignment() {
  // This would be scheduled to run at specific times
  // e.g., every morning at 8 AM

  const companies = await getAllCompanies(); // Your DB query

  for (const company of companies) {
    try {
      // Get unassigned jobs for this company
      const response = await fetch(`${company.baseUrl}/api/jobs?limit=100`, {
        headers: {
          'x-api-key': company.apiKey,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      const jobs = data.data || [];

      const unassignedJobs = jobs.filter(
        (job: any) => !job.assigned_users || job.assigned_users.length === 0
      );

      if (unassignedJobs.length === 0) continue;

      // Auto-assign them
      const jobUids = unassignedJobs.map((job: any) => job.job_uid);

      await batchDispatchJobs({
        apiKey: company.apiKey,
        baseUrl: company.baseUrl,
        jobUids: jobUids,
        optimize: true,
      });

      console.log(`✅ Assigned ${jobUids.length} jobs for ${company.name}`);

    } catch (error) {
      console.error(`❌ Failed for ${company.name}:`, error);
    }
  }
}

// ============================================================================
// HELPER: Mock function for example
// ============================================================================
async function getAllCompanies() {
  // This would query your database
  return [
    {
      name: 'Company A',
      apiKey: 'key-1',
      baseUrl: 'https://us.zuperpro.com'
    }
  ];
}

// ============================================================================
// TEST THE INTEGRATION
// ============================================================================

async function testIntegration() {
  console.log("🧪 Testing Webapp Integration");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Simulate user session data (in real app, this comes from auth)
  const mockUserSession = {
    apiKey: process.env.ZUPER_API_KEY || "59ed3a6f230c1803317a4974597edc33",
    baseUrl: process.env.ZUPER_BASE_URL || "https://eks-staging.zuperpro.com",
  };

  console.log("📋 Step 1: Get unassigned jobs\n");

  try {
    // Fetch jobs like your webapp would
    const response = await fetch(`${mockUserSession.baseUrl}/api/jobs?limit=10`, {
      headers: {
        'x-api-key': mockUserSession.apiKey,
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    const jobs = data.data || [];

    const unassignedJobs = jobs.filter(
      (job: any) => !job.assigned_users || job.assigned_users.length === 0
    );

    console.log(`✅ Found ${jobs.length} total jobs`);
    console.log(`📊 Unassigned: ${unassignedJobs.length} jobs\n`);

    if (unassignedJobs.length === 0) {
      console.log("ℹ️  No unassigned jobs to test with");
      console.log("💡 Showing how it would work with a job...\n");

      // Use first job as example
      if (jobs.length > 0) {
        const exampleJob = jobs[0];
        console.log(`📋 Example job: ${exampleJob.job_title || exampleJob.job_uid}`);
        console.log(`   Job UID: ${exampleJob.job_uid}\n`);

        console.log("📋 Step 2: Call dispatcher agent\n");

        const result = await dispatchJob({
          apiKey: mockUserSession.apiKey,
          baseUrl: mockUserSession.baseUrl,
          jobUid: exampleJob.job_uid,
        });

        console.log("✅ Dispatcher agent completed!\n");
        console.log("📝 Agent's Analysis:");
        console.log("─────────────────────────────────────────────────────");
        console.log(result.text);
        console.log("─────────────────────────────────────────────────────\n");
      }
    } else {
      // Test with actual unassigned job
      const testJob = unassignedJobs[0];
      console.log(`📋 Testing with: ${testJob.job_title || testJob.job_uid}`);
      console.log(`   Job UID: ${testJob.job_uid}\n`);

      console.log("📋 Step 2: Call dispatcher agent\n");

      const result = await dispatchJob({
        apiKey: mockUserSession.apiKey,
        baseUrl: mockUserSession.baseUrl,
        jobUid: testJob.job_uid,
      });

      console.log("✅ Dispatcher agent completed!\n");
      console.log("📝 Agent's Analysis:");
      console.log("─────────────────────────────────────────────────────");
      console.log(result.text);
      console.log("─────────────────────────────────────────────────────\n");
    }

    console.log("✅ Integration test successful!");
    console.log("\n💡 In your webapp, you would:");
    console.log("   1. Show a button 'Auto-Assign Technician'");
    console.log("   2. On click, call POST /api/jobs/:id/assign");
    console.log("   3. Backend calls dispatchJob() function");
    console.log("   4. Return result to frontend");
    console.log("   5. Show success message to user\n");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run test if executed directly
testIntegration();

// Export for your webapp
export {
  handleJobAssignment,
  handleBatchAssignment,
  dailyAutoAssignment,
  testIntegration,
};
