import { NextRequest, NextResponse } from "next/server";
import { queryUserActivityReports } from "../../../../lib/dynamodb";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get("timeRange") || "week";
    const userId = searchParams.get("userId"); // Optional filter by user

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(now.getTime() / 1000);

    if (userId) {
      // Query for specific user
      const activities = await queryUserActivityReports(
        userId,
        startTimestamp,
        endTimestamp
      );
      return NextResponse.json(activities);
    } else {
      // For demo purposes, return mock data since querying all users requires scanning
      // In production, you'd want to maintain a global activity index or use pagination
      const mockActivities = [
        {
          userId: "manager_001",
          timestamp: Math.floor(Date.now() / 1000) - 3600,
          userType: "Manager",
          action: "created_project",
          projectId: "project_123",
        },
        {
          userId: "worker_001",
          timestamp: Math.floor(Date.now() / 1000) - 7200,
          userType: "Worker",
          action: "completed_task",
          projectId: "project_123",
        },
        {
          userId: "worker_002",
          timestamp: Math.floor(Date.now() / 1000) - 10800,
          userType: "Worker",
          action: "login",
        },
        {
          userId: "manager_001",
          timestamp: Math.floor(Date.now() / 1000) - 14400,
          userType: "Manager",
          action: "assigned_task",
          projectId: "project_456",
        },
      ];

      return NextResponse.json(mockActivities);
    }
  } catch (error) {
    console.error("Error fetching user activity reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch user activity reports" },
      { status: 500 }
    );
  }
}
