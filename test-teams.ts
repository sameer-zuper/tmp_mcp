/**
 * Test Teams Endpoint
 * Verify the corrected /api/team endpoint works
 */

const API_KEY = "59ed3a6f230c1803317a4974597edc33";
const BASE_URL = "https://eks-staging.zuperpro.com";

async function testTeams() {
  console.log("🧪 Testing Teams Endpoint");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("Testing: /api/team (singular - corrected)");

  try {
    const response = await fetch(`${BASE_URL}/api/team`, {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success!`);
      console.log(`\nTotal teams: ${data.data?.length || 0}\n`);

      if (data.data && data.data.length > 0) {
        console.log("Sample teams:");
        data.data.slice(0, 5).forEach((team: any, index: number) => {
          console.log(`  ${index + 1}. ${team.team_name || team.name || 'Unnamed'}`);
          console.log(`     UID: ${team.team_uid || team.uid}`);
          if (team.description) console.log(`     Description: ${team.description}`);
        });

        console.log(`\n...and ${data.data.length - 5} more teams`);
      }

      console.log("\n✅ Teams endpoint is working correctly!");
      console.log("   The MCP server listTeams tool will now work.");

    } else {
      console.log(`❌ Failed: ${response.statusText}`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
}

testTeams();
