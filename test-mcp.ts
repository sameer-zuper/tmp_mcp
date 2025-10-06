/**
 * Test script for Zuper FSM MCP Server
 * Tests connectivity and basic functionality with staging environment
 */

import { mcp } from "./src/mastra/mcp/server";

const API_KEY = process.env.ZUPER_API_KEY || "";
const BASE_URL = process.env.ZUPER_BASE_URL || "";

console.log("🧪 Testing Zuper FSM MCP Server\n");
console.log("📡 Staging Environment:");
console.log(`   Base URL: ${BASE_URL}`);
console.log(`   API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}\n`);

async function testConnectivity() {
  console.log("1️⃣  Testing API Connectivity...");
  try {
    const result = await mcp.tools.listUsers({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
      page: 1,
      limit: 5
    });

    console.log("   ✅ Successfully connected to Zuper API");
    console.log(`   📊 Found ${result.count || 0} users\n`);
    return result;
  } catch (error) {
    console.error("   ❌ Connection failed:", error.message);
    throw error;
  }
}

async function testUserManagement() {
  console.log("2️⃣  Testing User Management...");
  try {
    // List all users
    const users = await mcp.tools.listUsers({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
      status: "active",
      limit: 10
    });

    console.log(`   ✅ Listed ${users.count || 0} active users`);

    if (users.data && users.data.length > 0) {
      const firstUser = users.data[0];
      console.log(`   👤 Sample user:`, firstUser);

      // Try to get user details
      if (firstUser.uid || firstUser.id) {
        const userUid = firstUser.uid || firstUser.id;
        console.log(`   🔍 Fetching details for user: ${userUid}`);

        try {
          const userDetails = await mcp.tools.getUser({
            apiKey: API_KEY,
            baseUrl: BASE_URL,
            userUid: userUid.toString()
          });
          console.log("   ✅ Got user details");

          // Try to get user skills
          try {
            const skills = await mcp.tools.getUserSkills({
              apiKey: API_KEY,
              baseUrl: BASE_URL,
              userUid: userUid.toString()
            });
            console.log("   ✅ Got user skills:", skills);
          } catch (skillError) {
            console.log("   ⚠️  Skills endpoint not available or user has no skills");
          }
        } catch (detailError) {
          console.log("   ⚠️  Could not fetch user details:", detailError.message);
        }
      }
    }

    console.log();
    return users;
  } catch (error) {
    console.error("   ❌ User management test failed:", error.message);
    throw error;
  }
}

async function testJobManagement() {
  console.log("3️⃣  Testing Job Management...");
  try {
    // List jobs
    const jobs = await mcp.tools.listJobs({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
      page: 1,
      limit: 5
    });

    console.log(`   ✅ Listed ${jobs.count || 0} jobs`);

    if (jobs.data && jobs.data.length > 0) {
      console.log(`   📋 Sample job:`, jobs.data[0]);
    }

    console.log();
    return jobs;
  } catch (error) {
    console.error("   ❌ Job management test failed:", error.message);
    console.log("   ℹ️  This might be expected if no jobs exist in staging\n");
  }
}

async function testCustomerManagement() {
  console.log("4️⃣  Testing Customer Management...");
  try {
    // List customers
    const customers = await mcp.tools.listCustomers({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
      page: 1,
      limit: 5
    });

    console.log(`   ✅ Listed ${customers.count || 0} customers`);

    if (customers.data && customers.data.length > 0) {
      console.log(`   👥 Sample customer:`, customers.data[0]);
    }

    console.log();
    return customers;
  } catch (error) {
    console.error("   ❌ Customer management test failed:", error.message);
    console.log("   ℹ️  This might be expected if no customers exist in staging\n");
  }
}

async function testTimeOffManagement() {
  console.log("5️⃣  Testing Time-Off Management...");
  try {
    // List time-off requests
    const timeOffRequests = await mcp.tools.listTimeOffRequests({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
      page: 1,
      limit: 5
    });

    console.log(`   ✅ Listed ${timeOffRequests.count || 0} time-off requests`);

    if (timeOffRequests.data && timeOffRequests.data.length > 0) {
      console.log(`   🏖️  Sample time-off:`, timeOffRequests.data[0]);
    }

    console.log();
    return timeOffRequests;
  } catch (error) {
    console.error("   ❌ Time-off management test failed:", error.message);
    console.log("   ℹ️  This might be expected if endpoint is not available\n");
  }
}

async function testTeamManagement() {
  console.log("6️⃣  Testing Team Management...");
  try {
    // List teams
    const teams = await mcp.tools.listTeams({
      apiKey: API_KEY,
      baseUrl: BASE_URL,
      page: 1,
      limit: 5
    });

    console.log(`   ✅ Listed ${teams.count || 0} teams`);

    if (teams.data && teams.data.length > 0) {
      console.log(`   👥 Sample team:`, teams.data[0]);
    }

    console.log();
    return teams;
  } catch (error) {
    console.error("   ❌ Team management test failed:", error.message);
    console.log("   ℹ️  This might be expected if no teams exist\n");
  }
}

async function testResourceAccess() {
  console.log("7️⃣  Testing Resource Access...");
  // Note: Resources currently use environment variables
  // This test just shows that resources are configured
  console.log("   ℹ️  Resources configured:");
  console.log("      - zuper://jobs");
  console.log("      - zuper://customers");
  console.log("      - zuper://invoices");
  console.log("      - zuper://properties");
  console.log("      - zuper://dashboard");
  console.log("   ⚠️  Resources need to be updated to support dynamic API keys\n");
}

async function runAllTests() {
  const startTime = Date.now();

  try {
    // Test connectivity first
    await testConnectivity();

    // Run all other tests
    await testUserManagement();
    await testJobManagement();
    await testCustomerManagement();
    await testTimeOffManagement();
    await testTeamManagement();
    await testResourceAccess();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("✨ Test Suite Completed Successfully!");
    console.log(`⏱️  Total time: ${duration}s\n`);
    console.log("🎯 Next Steps:");
    console.log("   1. Review the API responses above");
    console.log("   2. Test creating a job (if you have customer data)");
    console.log("   3. Test the Dispatcher Agent with a real job");
    console.log("   4. Integrate into your application\n");

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error("\n❌ Test Suite Failed");
    console.error(`⏱️  Failed after: ${duration}s`);
    console.error(`🔍 Error: ${error.message}\n`);
    console.log("🔧 Troubleshooting:");
    console.log("   1. Verify API key is correct");
    console.log("   2. Check base URL is accessible");
    console.log("   3. Ensure staging environment is running");
    console.log("   4. Review API permissions\n");
    process.exit(1);
  }
}

// Run tests
console.log("═══════════════════════════════════════════════════════════\n");
runAllTests().then(() => {
  console.log("═══════════════════════════════════════════════════════════");
}).catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
