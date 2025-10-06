/**
 * Test /api/teams/summary endpoint from docs
 */

const API_KEY = "59ed3a6f230c1803317a4974597edc33";
const BASE_URL = "https://eks-staging.zuperpro.com";

async function testTeamsEndpoints() {
  console.log("🧪 Testing Teams Endpoints");
  console.log("═══════════════════════════════════════════════════════════\n");

  const endpoints = [
    "/api/team",           // What worked before
    "/api/teams",          // Plural (was 404)
    "/api/teams/summary",  // From Zuper docs
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        },
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS - ${data.data?.length || 0} items\n`);
      } else {
        console.log(`   ❌ FAILED\n`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
    }
  }

  console.log("═══════════════════════════════════════════════════════════");
}

testTeamsEndpoints();
