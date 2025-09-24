/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Test script for manager creation and automatic mock data generation
 * This tests the integration between auth.ts and generate-mock-data.js
 */

// Import the auth function
const { createOrGetManager } = require("../lib/auth");
const { v4: uuidv4 } = require("uuid");

async function testManagerCreationWithMockData() {
  try {
    console.log(
      "🧪 Testing automatic mock data generation on manager creation...\n",
    );

    // Generate a new UUID for testing
    const testUUID = uuidv4();
    console.log(`📋 Generated test UUID: ${testUUID}\n`);

    // Create a new manager (this should trigger mock data generation)
    console.log("🔄 Creating new manager...");
    const result = await createOrGetManager(testUUID, "Test Manager");

    if (result.manager) {
      console.log("\n✅ Manager created successfully!");
      console.log("📊 Manager details:", {
        deviceUUID: result.manager.deviceUUID,
        name: result.manager.name,
        email: result.manager.email,
      });
    } else {
      console.log("\n❌ Manager creation failed");
    }

    if (result.sessionId) {
      console.log("🔐 Session created:", result.sessionId);
    }

    console.log("\n🎉 Test completed successfully!");
    console.log(
      "📝 Check the console output above to see if mock data was generated automatically.",
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testManagerCreationWithMockData();
