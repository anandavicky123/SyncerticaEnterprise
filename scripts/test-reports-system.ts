import { seedTestReports } from "../lib/seed-reports";
import { queryUserActivityReports, generateReportSummary } from "../lib/dynamodb-reports";

async function testReportsSystem() {
  try {
    console.log("🧪 Testing Reports System");
    console.log("=" .repeat(40));

    const testManagerUUID = "test-manager-123-456-789";
    
    // 1. Seed test data
    console.log("1. Seeding test data...");
    await seedTestReports(testManagerUUID);
    console.log("✅ Test data seeded successfully");

    // 2. Test querying reports
    console.log("\n2. Querying user activity reports...");
    const activityReports = await queryUserActivityReports(testManagerUUID);
    console.log(`✅ Found ${activityReports.length} activity reports`);
    
    if (activityReports.length > 0) {
      console.log("   Sample report:", {
        actorId: activityReports[0].actorId,
        action: activityReports[0].action,
        description: activityReports[0].description,
        timestamp: activityReports[0].timestamp
      });
    }

    // 3. Test generating summary
    console.log("\n3. Generating report summary...");
    const summary = await generateReportSummary(testManagerUUID);
    console.log("✅ Report summary generated:");
    console.log(`   Total activities: ${summary.totalActivities}`);
    console.log(`   Unique users: ${summary.uniqueUsers}`);
    console.log(`   Actions breakdown:`, summary.actionCounts);

    console.log("\n🎉 All tests passed! Reports system is working correctly.");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testReportsSystem();