// lib/notifications.ts
import { v4 as uuidv4 } from "uuid";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// Setup DynamoDB Client for notifications
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export interface NotificationItem {
  PK: string; // "MANAGER#<managerUUID>"
  SK: string; // "NOTIF#2025-09-15T12:34:56Z#<notifId>"
  managerUUID: string;
  notifId: string;
  type: "task_update" | "worker_message";
  createdAt: string;
  status: "unread" | "read";

  // Optional fields based on type
  taskId?: string;
  workerId?: string;
  message?: string;
}

export interface CreateNotificationParams {
  managerUUID: string;
  type: "task_update" | "worker_message";
  workerId: string;
  message: string;
  taskId?: string; // Required for task_update, optional for worker_message
}

/**
 * Create a notification in DynamoDB Notifications table
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<string> {
  const notifId = uuidv4();
  const createdAt = new Date().toISOString();
  const pk = `MANAGER#${params.managerUUID}`;
  const sk = `NOTIF#${createdAt}#${notifId}`;

  const item: NotificationItem = {
    PK: pk,
    SK: sk,
    managerUUID: params.managerUUID,
    notifId,
    type: params.type,
    createdAt,
    status: "unread",
    workerId: params.workerId,
    message: params.message,
  };

  // Add taskId if provided (required for task_update)
  if (params.taskId) {
    item.taskId = params.taskId;
  }

  try {
    await docClient.send(
      new PutCommand({
        TableName: "Notifications",
        Item: item,
      }),
    );

    console.log(
      `Created notification ${notifId} for manager ${params.managerUUID}`,
    );
    return notifId;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Get notifications for a specific manager
 */
export async function getManagerNotifications(
  managerUUID: string,
  limit: number = 50,
): Promise<NotificationItem[]> {
  try {
    const pk = `MANAGER#${managerUUID}`;

    const result = await docClient.send(
      new QueryCommand({
        TableName: "Notifications",
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
        Limit: limit,
        ScanIndexForward: false, // Most recent first
      }),
    );

    return (result.Items as NotificationItem[]) || [];
  } catch (error) {
    console.error("Error getting manager notifications:", error);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  managerUUID: string,
  notifId: string,
): Promise<boolean> {
  try {
    // First, find the notification by querying and filtering
    const notifications = await getManagerNotifications(managerUUID, 100);
    const notification = notifications.find((n) => n.notifId === notifId);

    if (!notification) {
      console.warn(
        `Notification ${notifId} not found for manager ${managerUUID}`,
      );
      return false;
    }

    await docClient.send(
      new UpdateCommand({
        TableName: "Notifications",
        Key: {
          PK: notification.PK,
          SK: notification.SK,
        },
        UpdateExpression: "SET #status = :read",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":read": "read" },
      }),
    );

    console.log(`Marked notification ${notifId} as read`);
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

/**
 * Helper function to create task update notification
 */
export async function createTaskUpdateNotification(
  managerUUID: string,
  workerId: string,
  taskId: string,
  workerName: string,
  taskTitle: string,
  newStatus: string,
): Promise<string> {
  const message = `${workerName} marked "${taskTitle}" as ${newStatus}`;

  return createNotification({
    managerUUID,
    type: "task_update",
    workerId,
    taskId,
    message,
  });
}

/**
 * Helper function to create worker message notification
 */
export async function createWorkerMessageNotification(
  managerUUID: string,
  workerId: string,
  workerName: string,
  messageContent: string,
): Promise<string> {
  const message = `New message from ${workerName}: ${messageContent.substring(
    0,
    100,
  )}${messageContent.length > 100 ? "..." : ""}`;

  return createNotification({
    managerUUID,
    type: "worker_message",
    workerId,
    message,
  });
}
