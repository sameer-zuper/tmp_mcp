/**
 * Simple test for Zuper API connectivity
 * Tests direct API calls to verify credentials work
 */

const API_KEY = "59ed3a6f230c1803317a4974597edc33";
const BASE_URL = "https://eks-staging.zuperpro.com";

console.log("🧪 Testing Zuper API Connection\n");
console.log("📡 Staging Environment:");
console.log(`   Base URL: ${BASE_URL}`);
console.log(`   API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}\n`);

async function testAPI(endpoint: string, description: string) {
  console.log(`Testing: ${description}`);
  console.log(`   Endpoint: ${BASE_URL}${endpoint}`);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   Error: ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    console.log(`   ✅ Success! Response:`, JSON.stringify(data, null, 2).substring(0, 500));
    return data;
  } catch (error) {
    console.error(`   ❌ Failed:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log("═══════════════════════════════════════════════════════════\n");

  // Test 1: List users
  await testAPI("/api/user/all", "Get All Users");
  console.log("\n");

  // Test 2: List jobs
  await testAPI("/api/jobs", "Get All Jobs");
  console.log("\n");

  // Test 3: List customers
  await testAPI("/api/customers", "Get All Customers");
  console.log("\n");

  // Test 4: List teams
  await testAPI("/api/teams", "Get All Teams");
  console.log("\n");

  console.log("═══════════════════════════════════════════════════════════");
}

runTests();
