// lib/dynamodb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
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
  details?: Record<string, any>;
}

export async function createAuditLog(
  actorType: "worker" | "manager",
  actorId: string,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, any>
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
export interface NotificationItem {
  userId: string; // PK
  createdAt: number; // SK
  type: string;
  message: string;
  status: "unread" | "read";
  triggeredBy?: string;
}

export async function putNotification(item: NotificationItem) {
  try {
    await docClient.send(
      new PutCommand({
        TableName: "notifications",
        Item: item,
      })
    );
  } catch (error) {
    console.error("Error putting notification:", error);
  }
}

export async function getNotifications(
  userId: string,
  limit: number = 50
): Promise<NotificationItem[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: "notifications",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        Limit: limit,
        ScanIndexForward: false,
      })
    );
    return (result.Items as NotificationItem[]) || [];
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
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
