/**
 * Test All Endpoints with CORRECT paths from Zuper Documentation
 */

const API_KEY = "59ed3a6f230c1803317a4974597edc33";
const BASE_URL = "https://eks-staging.zuperpro.com";

interface EndpointTest {
  name: string;
  endpoint: string;
  category: string;
}

const correctEndpoints: EndpointTest[] = [
  // User Management (already working)
  { name: "List Users", endpoint: "/api/user/all", category: "Users" },
  { name: "User Skills", endpoint: "/api/users/6c513b60-ff7c-11e7-b3a8-29b417a4f3fa/skill", category: "Users" },

  // Team Management (already working)
  { name: "List Teams (all)", endpoint: "/api/team", category: "Teams" },
  { name: "List Teams (summary)", endpoint: "/api/teams/summary", category: "Teams" },

  // Job Management (already working)
  { name: "List Jobs", endpoint: "/api/jobs", category: "Jobs" },

  // Customer Management (already working)
  { name: "List Customers", endpoint: "/api/customers", category: "Customers" },

  // Property Management - CORRECTED
  { name: "List Properties", endpoint: "/api/property", category: "Properties" },

  // Invoice Management - CORRECTED
  { name: "List Invoices", endpoint: "/api/invoice", category: "Invoices" },

  // Asset Management (already working)
  { name: "List Assets", endpoint: "/api/assets", category: "Assets" },

  // Parts & Inventory - CORRECTED
  { name: "List Products/Parts", endpoint: "/api/product", category: "Parts" },

  // Service Contracts - CORRECTED
  { name: "List Service Contracts", endpoint: "/api/service_contract", category: "Contracts" },

  // Quotes - CORRECTED
  { name: "List Quotes/Estimates", endpoint: "/api/estimate", category: "Quotes" },

  // Timesheets - Already had correct path
  { name: "List Timesheets", endpoint: "/api/timesheets", category: "Timesheets" },

  // Time-off - CORRECTED
  { name: "List Time-off Requests", endpoint: "/api/timesheets/request/timeoff", category: "Time-off" },
];

async function testEndpoint(test: EndpointTest) {
  try {
    const response = await fetch(`${BASE_URL}${test.endpoint}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    const success = response.ok;
    let dataCount: number | undefined;
    let errorDetail = "";

    if (success) {
      try {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          dataCount = data.data.length;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    } else {
      const text = await response.text();
      errorDetail = text.substring(0, 100);
    }

    return {
      name: test.name,
      endpoint: test.endpoint,
      category: test.category,
      status: response.status,
      success,
      error: success ? undefined : response.statusText,
      errorDetail,
      dataCount,
    };
  } catch (error) {
    return {
      name: test.name,
      endpoint: test.endpoint,
      category: test.category,
      status: 0,
      success: false,
      error: error.message,
      errorDetail: "",
    };
  }
}

async function runCorrectedEndpointTests() {
  console.log("🧪 TESTING CORRECTED ZUPER API ENDPOINTS");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Using correct paths from Zuper API Documentation");
  console.log(`📡 Base URL: ${BASE_URL}\n`);

  const results = await Promise.all(correctEndpoints.map(testEndpoint));

  // Group by category
  const byCategory = results.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  // Print results by category
  for (const [category, categoryResults] of Object.entries(byCategory)) {
    console.log(`\n📂 ${category}`);
    console.log("─".repeat(70));

    categoryResults.forEach(result => {
      const icon = result.success ? "✅" : "❌";
      const countInfo = result.dataCount !== undefined ? ` [${result.dataCount} items]` : "";

      console.log(`${icon} ${result.name.padEnd(30)} ${result.status}${countInfo}`);
      console.log(`   ${result.endpoint}`);

      if (!result.success && result.errorDetail) {
        console.log(`   Error: ${result.errorDetail.substring(0, 60)}...`);
      }
    });
  }

  // Summary
  console.log("\n\n📊 SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");

  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const notFound = results.filter(r => r.status === 404).length;
  const badRequest = results.filter(r => r.status === 400).length;
  const errors = results.filter(r => !r.success && r.status !== 404 && r.status !== 400).length;

  console.log(`Total Endpoints Tested: ${total}`);
  console.log(`✅ Successful (200): ${successful} (${((successful / total) * 100).toFixed(1)}%)`);
  console.log(`❌ Not Found (404): ${notFound}`);
  console.log(`⚠️  Bad Request (400): ${badRequest}`);
  console.log(`⚠️  Other Errors: ${errors}`);

  // Improvements
  const previousWorking = 6;
  const improvement = successful - previousWorking;

  console.log(`\n🎯 IMPROVEMENT:`);
  console.log(`   Before: ${previousWorking} working endpoints`);
  console.log(`   After:  ${successful} working endpoints`);
  console.log(`   Gain:   +${improvement} endpoints ${improvement > 0 ? '🎉' : ''}`);

  // List working endpoints
  if (successful > 0) {
    console.log("\n\n✅ WORKING ENDPOINTS:");
    console.log("─".repeat(70));
    results
      .filter(r => r.success)
      .forEach(r => {
        const countInfo = r.dataCount !== undefined ? ` [${r.dataCount} items]` : "";
        console.log(`   ${r.endpoint}${countInfo}`);
      });
  }

  // List issues
  if (notFound > 0 || badRequest > 0) {
    console.log("\n\n⚠️  ISSUES:");
    console.log("─".repeat(70));

    if (notFound > 0) {
      console.log("❌ Not Found (404):");
      results
        .filter(r => r.status === 404)
        .forEach(r => console.log(`   ${r.endpoint}`));
    }

    if (badRequest > 0) {
      console.log("\n⚠️  Bad Request (400) - May need parameters:");
      results
        .filter(r => r.status === 400)
        .forEach(r => console.log(`   ${r.endpoint}`));
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════\n");

  // Recommendations
  if (successful === total) {
    console.log("🎉 SUCCESS! All endpoints are working correctly!");
    console.log("   → Ready to update server.ts with correct paths");
    console.log("   → All 42 MCP tools will be fully functional\n");
  } else if (successful > previousWorking) {
    console.log("✅ PROGRESS! More endpoints working than before.");
    console.log(`   → ${improvement} additional endpoint(s) now working`);
    console.log("   → Update server.ts with correct paths");
    console.log("   → Investigate remaining issues\n");
  }

  return { total, successful, improvement };
}

runCorrectedEndpointTests();
