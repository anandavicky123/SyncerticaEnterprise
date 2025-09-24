// scripts/test-notifications.ts
/**
 * Test script to verify the notification system is working
 * This script will:
 * 1. Create a test task update notification
 * 2. Create a test worker message notification
 * 3. Query notifications to verify they were created
 */

import {
  createTaskUpdateNotification,
  createWorkerMessageNotification,
  getManagerNotifications,
} from "../lib/notifications";

async function testNotifications() {
  console.log("Testing notification system...\n");

  // Use a test manager UUID
  const testManagerUUID = "test-manager-uuid-123";
  const testWorkerId = "test-worker-id-456";
  const testTaskId = "test-task-id-789";

  try {
    console.log("1. Creating task update notification...");
    const taskNotifId = await createTaskUpdateNotification(
      testManagerUUID,
      testWorkerId,
      testTaskId,
      "John Doe",
      "Complete the UI design",
      "completed",
    );
    console.log(`✓ Created task update notification: ${taskNotifId}\n`);

    console.log("2. Creating worker message notification...");
    const messageNotifId = await createWorkerMessageNotification(
      testManagerUUID,
      testWorkerId,
      "Jane Smith",
      "Can I get clarification on the project requirements?",
    );
    console.log(`✓ Created worker message notification: ${messageNotifId}\n`);

    console.log("3. Querying notifications for manager...");
    const notifications = await getManagerNotifications(testManagerUUID, 10);
    console.log(`✓ Found ${notifications.length} notifications:`);

    notifications.forEach((notif, index) => {
      console.log(
        `  ${index + 1}. Type: ${notif.type}, Status: ${notif.status}`,
      );
      console.log(`     Message: ${notif.message}`);
      console.log(`     Created: ${notif.createdAt}\n`);
    });

    console.log("✅ Notification system test completed successfully!");
  } catch (error) {
    console.error("❌ Notification system test failed:", error);
    throw error;
  }
}

export { testNotifications };

// Only run if called directly
if (require.main === module) {
  testNotifications().catch(console.error);
}
