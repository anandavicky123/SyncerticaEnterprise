import {
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { dynamoClient, AWS_CONFIG } from "./aws-config";

export interface SessionData {
  id: string;
  userId: string;
  sessionToken: string;
  expires: number;
  metadata?: Record<string, unknown>;
}

export class DynamoDBSessionStore {
  private tableName: string;

  constructor() {
    this.tableName = AWS_CONFIG.dynamodb.sessionsTable;
  }

  async createSession(session: SessionData): Promise<void> {
    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall({
        ...session,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      console.error("Error creating session:", error);
      throw error;
    }
  }

  async getSession(sessionToken: string): Promise<SessionData | null> {
    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({ id: sessionToken }),
    });

    try {
      const result = await dynamoClient.send(command);
      if (!result.Item) return null;

      const session = unmarshall(result.Item) as SessionData;

      // Check if session is expired
      if (session.expires < Date.now()) {
        await this.deleteSession(sessionToken);
        return null;
      }

      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  async updateSession(
    sessionToken: string,
    updates: Partial<SessionData>
  ): Promise<void> {
    const command = new UpdateItemCommand({
      TableName: this.tableName,
      Key: marshall({ id: sessionToken }),
      UpdateExpression: "SET updatedAt = :updatedAt",
      ExpressionAttributeValues: marshall({
        ":updatedAt": Date.now(),
        ...Object.entries(updates).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [`:${key}`]: value,
          }),
          {}
        ),
      }),
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  }

  async deleteSession(sessionToken: string): Promise<void> {
    const command = new DeleteItemCommand({
      TableName: this.tableName,
      Key: marshall({ id: sessionToken }),
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  }
}

export const sessionStore = new DynamoDBSessionStore();
