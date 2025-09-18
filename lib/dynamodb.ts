// lib/dynamodb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

// --- Setup DynamoDB Client ---
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// ==============================
// Session Management
// ==============================
export interface Session {
  sessionId: string;
  actorType: "manager" | "worker";
  actorId: string;
  createdAt: string;
  expiresAt: string;
}

export async function createSession(
  actorType: "manager" | "worker",
  actorId: string
): Promise<string> {
  const sessionId = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  const session: Session = {
    sessionId,
    actorType,
    actorId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  console.log("Creating session with data:", session);

  await docClient.send(
    new PutCommand({
      TableName: "sessions",
      Item: {
        ...session,
        TTL: Math.floor(expiresAt.getTime() / 1000), // DynamoDB TTL (must be enabled on table)
      },
    })
  );

  return sessionId;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: "sessions",
        Key: { sessionId },
      })
    );

    if (!result.Item) return null;

    const item = result.Item as Session;

    // Expiry check
    const expiresAt = new Date(item.expiresAt);
    if (expiresAt < new Date()) {
      await deleteSession(sessionId);
      return null;
    }

    return item;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: "sessions",
        Key: { sessionId },
      })
    );
  } catch (error) {
    console.error("Error deleting session:", error);
  }
}

// ==============================
// Audit Logging
// ==============================
export interface AuditLog {
  logId: string;
  createdAt: string;
  actorType: "worker" | "manager";
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function createAuditLog(
  actorType: "worker" | "manager",
  actorId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const logId = uuidv4();
  const createdAt = new Date().toISOString();

  const auditLog: AuditLog = {
    logId,
    createdAt,
    actorType,
    actorId,
    action,
    entity,
    entityId,
    details,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: "audit_logs",
        Item: auditLog,
      })
    );
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
}

export async function getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: "audit_logs",
        KeyConditionExpression: "actorType = :actorType", // requires GSI if not partitioned by actorType
        ExpressionAttributeValues: {
          ":actorType": "manager", // Example: fetch manager logs
        },
        Limit: limit,
        ScanIndexForward: false, // most recent first
      })
    );

    return (result.Items as AuditLog[]) || [];
  } catch (error) {
    console.error("Error getting audit logs:", error);
    return [];
  }
}

export async function getAuditLogsByActor(
  actorId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: "audit_logs",
        IndexName: "ActorIndex", // <-- requires you to create this GSI: actorId as PK
        KeyConditionExpression: "actorId = :actorId",
        ExpressionAttributeValues: {
          ":actorId": actorId,
        },
        Limit: limit,
        ScanIndexForward: false,
      })
    );

    return (result.Items as AuditLog[]) || [];
  } catch (error) {
    console.error("Error getting audit logs by actor:", error);
    return [];
  }
}

// ==============================
// Reports: New schema helpers
// ==============================

// a) User Activity Reports
export interface UserActivityReport {
  userId: string; // PK
  timestamp: number; // SK (unix)
  userType: "Manager" | "Worker";
  action: string;
  projectId?: string;
}

export async function putUserActivityReport(item: UserActivityReport) {
  try {
    await docClient.send(
      new PutCommand({
        TableName: "user_activity_reports",
        Item: item,
      })
    );
  } catch (error) {
    console.error("Error putting user activity report:", error);
  }
}

export async function queryUserActivityReports(
  userId: string,
  limit: number = 50
): Promise<UserActivityReport[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: "user_activity_reports",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        Limit: limit,
        ScanIndexForward: false,
      })
    );
    return (result.Items as UserActivityReport[]) || [];
  } catch (error) {
    console.error("Error querying user activity reports:", error);
    return [];
  }
}

// b) Project & Task Reports
export interface ProjectTaskReport {
  projectId: string; // PK
  taskId: string; // SK
  assignedTo?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: number | null;
  updatedBy?: string;
}

export async function putProjectTaskReport(item: ProjectTaskReport) {
  try {
    await docClient.send(
      new PutCommand({
        TableName: "project_task_reports",
        Item: item,
      })
    );
  } catch (error) {
    console.error("Error putting project task report:", error);
  }
}

export async function queryProjectReports(
  projectId: string,
  limit: number = 100
): Promise<ProjectTaskReport[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: "project_task_reports",
        KeyConditionExpression: "projectId = :pid",
        ExpressionAttributeValues: { ":pid": projectId },
        Limit: limit,
        ScanIndexForward: false,
      })
    );

    return (result.Items as ProjectTaskReport[]) || [];
  } catch (error) {
    console.error("Error querying project reports:", error);
    return [];
  }
}

// c) Notifications & Alerts
// Legacy NotificationItem removed in favor of single-table 'Notifications' schema
export interface NotificationWriteItem {
  // userId can be 'manager:<uuid>' to target manager, or plain worker id for workers
  userId: string;
  notifId?: string;
  type: string; // e.g. 'task_update' | 'worker_message' | 'chat'
  message?: string;
  status?: "unread" | "read";
  triggeredBy?: string;
  taskId?: string;
  workerId?: string;
}

/**
 * Put a notification into the single DynamoDB table named 'Notifications'.
 * It will write an item with PK = 'MANAGER#<uuid>' for manager targets (userId like 'manager:<uuid>')
 * or PK = 'USER#<id>' for worker targets.
 */
export async function putNotification(item: NotificationWriteItem) {
  try {
    const notifId = item.notifId || uuidv4();
    const createdAt = new Date().toISOString();
    let pk: string;
    const attributes: Record<string, any> = {
      notifId,
      type: item.type,
      message: item.message,
      status: item.status || "unread",
      createdAt,
      triggeredBy: item.triggeredBy,
      taskId: item.taskId,
      workerId: item.workerId,
    };

    if (item.userId && item.userId.startsWith("manager:")) {
      const managerUUID = item.userId.split(":")[1];
      pk = `MANAGER#${managerUUID}`;
      attributes.managerUUID = managerUUID;
    } else {
      pk = `USER#${item.userId}`;
      attributes.userId = item.userId;
    }

    const sk = `NOTIF#${createdAt}#${notifId}`;

    await docClient.send(
      new PutCommand({
        TableName: "Notifications",
        Item: {
          PK: pk,
          SK: sk,
          ...attributes,
        },
      })
    );
  } catch (error) {
    console.error("Error putting notification:", error);
  }
}

export interface DynamoNotificationItem {
  PK: string;
  SK: string;
  notifId: string;
  type: "task_update" | "worker_message" | string;
  message?: string;
  status: "unread" | "read";
  createdAt: string;
  managerUUID?: string;
  userId?: string;
  workerId?: string;
  taskId?: string;
  triggeredBy?: string;
}

/**
 * Get notifications for a manager or worker. If userId starts with 'manager:' it will query PK=MANAGER#<uuid>,
 * otherwise it will query PK=USER#<userId>.
 */
export async function getNotifications(
  userId: string,
  limit: number = 50
): Promise<DynamoNotificationItem[]> {
  try {
    let pk: string;
    if (userId.startsWith("manager:")) {
      const managerUUID = userId.split(":")[1];
      pk = `MANAGER#${managerUUID}`;
    } else {
      pk = `USER#${userId}`;
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: "Notifications",
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
        Limit: limit,
        ScanIndexForward: false,
      })
    );
    return (result.Items as DynamoNotificationItem[]) || [];
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

// New helpers for Notifications table which uses a partition key format MANAGER#<managerUUID>
export async function queryManagerNotifications(
  managerUUID: string,
  limit: number = 20
): Promise<DynamoNotificationItem[]> {
  try {
    const pk = `MANAGER#${managerUUID}`;
    const result = await docClient.send(
      new QueryCommand({
        TableName: "Notifications",
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": pk },
        Limit: limit,
        ScanIndexForward: false,
      })
    );

    return (result.Items as DynamoNotificationItem[]) || [];
  } catch (error) {
    console.error("Error querying manager notifications:", error);
    return [];
  }
}

export async function markNotificationRead(
  managerUUID: string,
  notifId: string
): Promise<boolean> {
  try {
    // We need to find the SK for this notifId. For simplicity, query for items with PK and filter client-side.
    const items = await queryManagerNotifications(managerUUID, 100);
    const item = items.find((i) => i.notifId === notifId);
    if (!item) return false;

    await docClient.send(
      new UpdateCommand({
        TableName: "Notifications",
        Key: { PK: item.PK, SK: item.SK },
        UpdateExpression: "SET #s = :read",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":read": "read" },
      })
    );
    return true;
  } catch (error) {
    console.error("Error marking notification read:", error);
    return false;
  }
}

/**
 * Mark a notification as read for a generic user identifier.
 * userId may be 'manager:<uuid>' or a plain worker id.
 */
export async function markNotificationReadForUser(
  userId: string,
  notifId: string
): Promise<boolean> {
  try {
    // Reuse getNotifications which understands 'manager:' prefix
    const items = await getNotifications(userId, 200);
    const item = items.find((i) => i.notifId === notifId);
    if (!item) return false;

    await docClient.send(
      new UpdateCommand({
        TableName: "Notifications",
        Key: { PK: item.PK, SK: item.SK },
        UpdateExpression: "SET #s = :read",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":read": "read" },
      })
    );

    return true;
  } catch (error) {
    console.error("Error marking notification read for user:", error);
    return false;
  }
}

// d) Performance Metrics
export interface PerformanceMetric {
  entityType: string;
  entityId_period: string; // PK
  metricType: string;
  metricValue: number;
  period: string;
  calculatedAt: number;
}

export async function putPerformanceMetric(item: PerformanceMetric) {
  try {
    await docClient.send(
      new PutCommand({
        TableName: "performance_metrics",
        Item: item,
      })
    );
  } catch (error) {
    console.error("Error putting performance metric:", error);
  }
}

export async function queryPerformanceMetrics(
  entityId_period: string,
  limit: number = 100
): Promise<PerformanceMetric[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: "performance_metrics",
        KeyConditionExpression: "entityId_period = :eid",
        ExpressionAttributeValues: { ":eid": entityId_period },
        Limit: limit,
        ScanIndexForward: false,
      })
    );
    return (result.Items as PerformanceMetric[]) || [];
  } catch (error) {
    console.error("Error querying performance metrics:", error);
    return [];
  }
}
