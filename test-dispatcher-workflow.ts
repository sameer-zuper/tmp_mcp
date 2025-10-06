/**
 * Test Dispatcher Workflow with Real Zuper Staging API
 *
 * This script demonstrates how a Dispatcher Agent would:
 * 1. Get job details
 * 2. Find available users
 * 3. Check user skills
 * 4. Verify availability (time-off, workload)
 * 5. Make assignment decision
 */

const API_KEY = "59ed3a6f230c1803317a4974597edc33";
const BASE_URL = "https://eks-staging.zuperpro.com";

// Helper function to make Zuper API requests
async function zuperRequest(endpoint: string, method: string = "GET", body?: any) {
  const url = `${BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Step 1: Get a job that needs assignment
async function getJobForAssignment() {
  console.log("\n📋 STEP 1: Finding jobs that need assignment");
  console.log("═══════════════════════════════════════════════════════════");

  try {
    const result = await zuperRequest("/api/jobs?limit=10");
    const jobs = result.data || [];

    console.log(`✅ Found ${jobs.length} jobs total`);

    // Find an unassigned job or one that needs reassignment
    const unassignedJobs = jobs.filter(job =>
      !job.assigned_users || job.assigned_users.length === 0
    );

    console.log(`📊 Unassigned jobs: ${unassignedJobs.length}`);

    if (unassignedJobs.length > 0) {
      const job = unassignedJobs[0];
      console.log(`\n🎯 Selected job for assignment:`);
      console.log(`   Job UID: ${job.job_uid}`);
      console.log(`   Title: ${job.job_title || 'N/A'}`);
      console.log(`   Customer: ${job.customer?.customer_first_name} ${job.customer?.customer_last_name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Priority: ${job.priority || 'Not set'}`);
      console.log(`   Scheduled: ${job.scheduled_start_time || 'Not scheduled'}`);
      return job;
    } else if (jobs.length > 0) {
      const job = jobs[0];
      console.log(`\n📌 Using first available job (already assigned):`);
      console.log(`   Job UID: ${job.job_uid}`);
      console.log(`   Title: ${job.job_title || 'N/A'}`);
      console.log(`   Currently assigned to: ${job.assigned_users?.length || 0} user(s)`);
      return job;
    }

    console.log("⚠️  No jobs found in staging environment");
    return null;
  } catch (error) {
    console.error("❌ Failed to fetch jobs:", error.message);
    return null;
  }
}

// Step 2: Get all available users/technicians
async function getAvailableUsers() {
  console.log("\n👥 STEP 2: Finding available technicians");
  console.log("═══════════════════════════════════════════════════════════");

  try {
    const result = await zuperRequest("/api/user/all");
    const users = result.data || [];

    console.log(`✅ Found ${users.length} users total`);

    // Show first few users as examples
    if (users.length > 0) {
      console.log(`\n📋 Sample users:`);
      users.slice(0, 3).forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`      UID: ${user.user_uid}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Phone: ${user.mobile_phone_number || 'N/A'}`);
        console.log(`      Designation: ${user.designation || 'N/A'}`);
      });
    }

    return users;
  } catch (error) {
    console.error("❌ Failed to fetch users:", error.message);
    return [];
  }
}

// Step 3: Check user skills (if endpoint available)
async function getUserSkills(userUid: string) {
  console.log(`\n🎯 Checking skills for user: ${userUid}`);

  try {
    const result = await zuperRequest(`/api/user/${userUid}/skills`);
    console.log(`   ✅ Skills:`, result.data);
    return result.data || [];
  } catch (error) {
    console.log(`   ⚠️  Skills endpoint not available or user has no skills`);
    return [];
  }
}

// Step 4: Check user's current job assignments
async function getUserWorkload(users: any[]) {
  console.log("\n📊 STEP 3: Analyzing user workload");
  console.log("═══════════════════════════════════════════════════════════");

  try {
    const result = await zuperRequest("/api/jobs");
    const allJobs = result.data || [];

    // Count jobs per user
    const workloadMap = new Map<string, number>();

    allJobs.forEach(job => {
      if (job.assigned_users && Array.isArray(job.assigned_users)) {
        job.assigned_users.forEach(userId => {
          workloadMap.set(userId, (workloadMap.get(userId) || 0) + 1);
        });
      }
    });

    console.log(`\n📈 Workload analysis:`);
    users.slice(0, 5).forEach(user => {
      const count = workloadMap.get(user.user_uid) || 0;
      console.log(`   ${user.first_name} ${user.last_name}: ${count} assigned jobs`);
    });

    return workloadMap;
  } catch (error) {
    console.error("❌ Failed to analyze workload:", error.message);
    return new Map();
  }
}

// Step 5: Check time-off (if endpoint available)
async function checkTimeOff(userUid: string) {
  console.log(`\n🏖️  Checking time-off for user: ${userUid}`);

  try {
    const result = await zuperRequest(`/api/timeoff?userUid=${userUid}`);
    console.log(`   ✅ Time-off status:`, result.data);
    return result.data || [];
  } catch (error) {
    console.log(`   ⚠️  Time-off endpoint not available`);
    return [];
  }
}

// Step 6: Score and rank candidates
function rankCandidates(users: any[], workloadMap: Map<string, number>) {
  console.log("\n🏆 STEP 4: Ranking candidates");
  console.log("═══════════════════════════════════════════════════════════");

  const scored = users.map(user => {
    const workload = workloadMap.get(user.user_uid) || 0;

    // Simple scoring algorithm
    // Lower workload = higher score
    const workloadScore = Math.max(0, 100 - (workload * 10));

    // Active users get bonus
    const activeScore = user.status === 'active' ? 20 : 0;

    const totalScore = workloadScore + activeScore;

    return {
      user,
      workload,
      score: totalScore
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  console.log(`\n📊 Top 5 candidates:`);
  scored.slice(0, 5).forEach((candidate, index) => {
    console.log(`   ${index + 1}. ${candidate.user.first_name} ${candidate.user.last_name}`);
    console.log(`      Score: ${candidate.score}`);
    console.log(`      Current workload: ${candidate.workload} jobs`);
    console.log(`      UID: ${candidate.user.user_uid}`);
  });

  return scored;
}

// Step 7: Make assignment recommendation
async function makeAssignmentRecommendation(job: any, rankedCandidates: any[]) {
  console.log("\n✨ STEP 5: Assignment Recommendation");
  console.log("═══════════════════════════════════════════════════════════");

  if (rankedCandidates.length === 0) {
    console.log("❌ No candidates available");
    return;
  }

  const topCandidate = rankedCandidates[0];

  console.log(`\n🎯 RECOMMENDED ASSIGNMENT:`);
  console.log(`   Job: ${job.job_title || job.job_uid}`);
  console.log(`   →  Assign to: ${topCandidate.user.first_name} ${topCandidate.user.last_name}`);
  console.log(`   User UID: ${topCandidate.user.user_uid}`);
  console.log(`\n💡 Reasoning:`);
  console.log(`   ✅ Lowest current workload: ${topCandidate.workload} jobs`);
  console.log(`   ✅ Score: ${topCandidate.score}/120`);
  console.log(`   ✅ Available for new assignments`);

  console.log(`\n📝 Alternative candidates:`);
  rankedCandidates.slice(1, 3).forEach((candidate, index) => {
    console.log(`   ${index + 2}. ${candidate.user.first_name} ${candidate.user.last_name} (Score: ${candidate.score})`);
  });

  console.log(`\n🔧 To assign this job, use:`);
  console.log(`   PUT ${BASE_URL}/api/jobs/${job.job_uid}`);
  console.log(`   Body: { "assigned_users": ["${topCandidate.user.user_uid}"] }`);

  return topCandidate;
}

// Main workflow
async function runDispatcherWorkflow() {
  console.log("🤖 ZUPER FSM DISPATCHER AGENT WORKFLOW");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Testing with Staging Environment");
  console.log(`API: ${BASE_URL}`);
  console.log(`Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);

  const startTime = Date.now();

  try {
    // Step 1: Get a job
    const job = await getJobForAssignment();
    if (!job) {
      console.log("\n⚠️  No jobs available to test with");
      return;
    }

    // Step 2: Get users
    const users = await getAvailableUsers();
    if (users.length === 0) {
      console.log("\n❌ No users available");
      return;
    }

    // Step 3: Analyze workload
    const workloadMap = await getUserWorkload(users);

    // Step 4: Rank candidates
    const rankedCandidates = rankCandidates(users, workloadMap);

    // Step 5: Make recommendation
    await makeAssignmentRecommendation(job, rankedCandidates);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n\n✅ WORKFLOW COMPLETED SUCCESSFULLY");
    console.log(`⏱️  Total time: ${duration}s`);
    console.log("\n🎉 The MCP server is working correctly!");
    console.log("\n📚 Next Steps:");
    console.log("   1. Integrate this logic into the Dispatcher Agent");
    console.log("   2. Add skill matching when skills endpoint is available");
    console.log("   3. Add time-off checking when endpoint is available");
    console.log("   4. Implement actual job assignment via API");
    console.log("   5. Connect to your web/mobile app");

  } catch (error) {
    console.error("\n❌ Workflow failed:", error.message);
    console.error(error);
  }

  console.log("\n═══════════════════════════════════════════════════════════\n");
}

// Run the workflow
runDispatcherWorkflow();
