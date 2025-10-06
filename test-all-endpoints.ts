/**
 * Comprehensive Zuper API Endpoint Test
 * Tests all endpoints we have tools for to verify availability
 */

const API_KEY = "59ed3a6f230c1803317a4974597edc33";
const BASE_URL = "https://eks-staging.zuperpro.com";

interface EndpointTest {
  name: string;
  endpoint: string;
  method: string;
  category: string;
}

const endpoints: EndpointTest[] = [
  // User Management
  { name: "List Users", endpoint: "/api/user/all", method: "GET", category: "Users" },
  { name: "Get User (sample)", endpoint: "/api/user/6c513b60-ff7c-11e7-b3a8-29b417a4f3fa", method: "GET", category: "Users" },

  // Team Management
  { name: "List Teams", endpoint: "/api/teams", method: "GET", category: "Teams" },
  { name: "List Teams (alt)", endpoint: "/api/team", method: "GET", category: "Teams" },
  { name: "List Teams (v2)", endpoint: "/api/v2/teams", method: "GET", category: "Teams" },

  // Job Management
  { name: "List Jobs", endpoint: "/api/jobs", method: "GET", category: "Jobs" },

  // Customer Management
  { name: "List Customers", endpoint: "/api/customers", method: "GET", category: "Customers" },

  // Property Management
  { name: "List Properties", endpoint: "/api/properties", method: "GET", category: "Properties" },

  // Invoice Management
  { name: "List Invoices", endpoint: "/api/invoices", method: "GET", category: "Invoices" },

  // Asset Management
  { name: "List Assets", endpoint: "/api/assets", method: "GET", category: "Assets" },

  // Parts & Inventory
  { name: "List Parts", endpoint: "/api/parts", method: "GET", category: "Parts" },
  { name: "List Parts (alt)", endpoint: "/api/part", method: "GET", category: "Parts" },

  // Service Contracts
  { name: "List Service Contracts", endpoint: "/api/service-contracts", method: "GET", category: "Contracts" },
  { name: "List Service Contracts (alt)", endpoint: "/api/servicecontracts", method: "GET", category: "Contracts" },

  // Quotes
  { name: "List Quotes", endpoint: "/api/quotes", method: "GET", category: "Quotes" },

  // Timesheets
  { name: "List Timesheets", endpoint: "/api/timesheets", method: "GET", category: "Timesheets" },
  { name: "List Timesheets (alt)", endpoint: "/api/timesheet", method: "GET", category: "Timesheets" },

  // Time-off
  { name: "List Time-off", endpoint: "/api/timeoff", method: "GET", category: "Time-off" },
  { name: "List Time-off (alt)", endpoint: "/api/time-off", method: "GET", category: "Time-off" },
  { name: "List Time-off Requests", endpoint: "/api/timeoff-requests", method: "GET", category: "Time-off" },
];

async function testEndpoint(test: EndpointTest): Promise<{
  name: string;
  endpoint: string;
  status: number;
  success: boolean;
  error?: string;
  dataCount?: number;
}> {
  try {
    const response = await fetch(`${BASE_URL}${test.endpoint}`, {
      method: test.method,
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    const success = response.ok;
    let dataCount: number | undefined;

    if (success) {
      try {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          dataCount = data.data.length;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    return {
      name: test.name,
      endpoint: test.endpoint,
      status: response.status,
      success,
      error: success ? undefined : response.statusText,
      dataCount,
    };
  } catch (error) {
    return {
      name: test.name,
      endpoint: test.endpoint,
      status: 0,
      success: false,
      error: error.message,
    };
  }
}

async function runAllEndpointTests() {
  console.log("🧪 COMPREHENSIVE ZUPER API ENDPOINT TEST");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}\n`);

  const results = await Promise.all(endpoints.map(testEndpoint));

  // Group by category
  const byCategory = results.reduce((acc, result) => {
    const test = endpoints.find(e => e.endpoint === result.endpoint);
    const category = test?.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  // Print results by category
  for (const [category, categoryResults] of Object.entries(byCategory)) {
    console.log(`\n📂 ${category}`);
    console.log("─".repeat(63));

    categoryResults.forEach(result => {
      const icon = result.success ? "✅" : "❌";
      const statusColor = result.success ? "" : "";
      const countInfo = result.dataCount !== undefined ? ` (${result.dataCount} items)` : "";

      console.log(`${icon} ${result.name.padEnd(30)} ${result.status} ${result.error || "OK"}${countInfo}`);
      if (!result.success && result.status !== 404) {
        console.log(`   Endpoint: ${result.endpoint}`);
      }
    });
  }

  // Summary
  console.log("\n\n📊 SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");

  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const notFound = results.filter(r => r.status === 404).length;
  const errors = results.filter(r => !r.success && r.status !== 404).length;

  console.log(`Total Endpoints Tested: ${total}`);
  console.log(`✅ Successful (200): ${successful}`);
  console.log(`❌ Not Found (404): ${notFound}`);
  console.log(`⚠️  Errors: ${errors}`);
  console.log(`Success Rate: ${((successful / total) * 100).toFixed(1)}%`);

  // List working endpoints
  console.log("\n\n✅ WORKING ENDPOINTS:");
  console.log("─".repeat(63));
  results
    .filter(r => r.success)
    .forEach(r => {
      const countInfo = r.dataCount !== undefined ? ` [${r.dataCount} items]` : "";
      console.log(`   ${r.endpoint}${countInfo}`);
    });

  // List not found endpoints
  if (notFound > 0) {
    console.log("\n\n❌ NOT FOUND (404) - May need different endpoint path:");
    console.log("─".repeat(63));
    results
      .filter(r => r.status === 404)
      .forEach(r => console.log(`   ${r.endpoint}`));
  }

  console.log("\n═══════════════════════════════════════════════════════════\n");

  // Recommendations
  if (notFound > 0) {
    console.log("💡 RECOMMENDATIONS:");
    console.log("1. Check Zuper API documentation for correct endpoint paths");
    console.log("2. Verify API version (some endpoints may be /api/v2/...)");
    console.log("3. Contact Zuper support to confirm endpoint availability");
    console.log("4. Update server.ts to use correct endpoint paths\n");
  }
}

runAllEndpointTests();
