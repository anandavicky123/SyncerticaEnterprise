import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const managerUUID = searchParams.get("managerUUID");

    if (!managerUUID) {
      return NextResponse.json(
        { error: "Manager UUID is required" },
        { status: 400 }
      );
    }

    // Ensure manager exists. If not, create a minimal manager record so analytics can proceed.
    let manager = await prisma.manager.findUnique({
      where: { deviceUUID: managerUUID },
    });
    if (!manager) {
      console.warn(
        `Manager with UUID ${managerUUID} not found — creating a new manager record.`
      );
      manager = await prisma.manager.create({
        data: {
          deviceUUID: managerUUID,
          // other fields will use schema defaults (dateFormat, timeFormat, createdAt, updatedAt)
        },
      });
    }

    // Get basic counts
    // First fetch worker IDs for the manager so we can filter chats by senderId/receiverId
    const workerRows = await prisma.worker.findMany({
      where: { managerDeviceUUID: managerUUID },
      select: { id: true },
    });
    const workerIds = workerRows.map((w) => w.id);

    const [
      totalWorkers,
      totalProjects,
      totalTasks,
      totalNotifications,
      completedTasks,
      activeProjects,
      pendingTasks,
      recentChats,
    ] = await Promise.all([
      prisma.worker.count({
        where: { managerDeviceUUID: managerUUID },
      }),
      prisma.project.count({
        where: { managerDeviceUUID: managerUUID },
      }),
      prisma.task.count({
        where: { assignedBy: managerUUID },
      }),
      prisma.notification.count({
        where: { managerDeviceUUID: managerUUID },
      }),
      // Count completed tasks with statusId = 3 and non-null updatedAt
      // This ties completion to the specific status ID and ensures updatedAt
      // represents the worker's completion action timestamp.
      prisma.task.count({
        where: {
          assignedBy: managerUUID,
          statusId: 3,
          updatedAt: {
            not: null,
          },
        },
      }),
      prisma.project.count({
        where: {
          managerDeviceUUID: managerUUID,
          status: "active",
        },
      }),
      prisma.task.count({
        where: {
          assignedBy: managerUUID,
          status: {
            category: "pending",
          },
        },
      }),
      prisma.chats.count({
        where: {
          OR: [
            // chats model stores raw senderId/receiverId; filter by worker IDs for this manager
            { senderId: { in: workerIds.length ? workerIds : ["__none__"] } },
            { receiverId: { in: workerIds.length ? workerIds : ["__none__"] } },
          ],
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Get task trends (last 6 months) and aggregate counts per DAY (UTC)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Fetch tasks created in the window and aggregate by UTC date string
    const createdTaskRows = await prisma.task.findMany({
      where: {
        assignedBy: managerUUID,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const creationCounts: Record<string, number> = {};
    for (const t of createdTaskRows) {
      const d = new Date(t.createdAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getUTCDate()).padStart(2, "0")}`;
      creationCounts[key] = (creationCounts[key] ?? 0) + 1;
    }

    const taskTrends = Object.entries(creationCounts)
      .map(([date, count]) => ({ date, _count: { id: count } }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Fetch tasks that were completed (statusId = 3) during the window
    const completedTaskRows = await prisma.task.findMany({
      where: {
        assignedBy: managerUUID,
        statusId: 3,
        updatedAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

    const completionCounts: Record<string, number> = {};
    for (const t of completedTaskRows) {
      if (!t.updatedAt) continue; // skip rows without updatedAt
      const d = new Date(t.updatedAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getUTCDate()).padStart(2, "0")}`;
      completionCounts[key] = (completionCounts[key] ?? 0) + 1;
    }

    const completedTaskTrends = Object.entries(completionCounts)
      .map(([date, count]) => ({ date, _count: { id: count } }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // Get worker productivity (tasks per worker)
    const workerProductivity = await prisma.worker.findMany({
      where: { managerDeviceUUID: managerUUID },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      take: 10,
    });

    // Get project status distribution
    const projectStatuses = await prisma.project.groupBy({
      by: ["status"],
      where: { managerDeviceUUID: managerUUID },
      _count: {
        id: true,
      },
    });

    // Get task priority distribution
    const taskPriorities = await prisma.task.groupBy({
      by: ["priority"],
      where: { assignedBy: managerUUID },
      _count: {
        id: true,
      },
    });

    // Calculate task completion rate
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTasksCreated = await prisma.task.count({
      where: {
        assignedBy: managerUUID,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const recentTasksCompleted = await prisma.task.count({
      where: {
        assignedBy: managerUUID,
        status: {
          category: "completed",
        },
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calculate changes from previous period (for trend indicators)
    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 60);
    previousPeriodStart.setHours(0, 0, 0, 0);

    const previousPeriodEnd = new Date();
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 30);
    previousPeriodEnd.setHours(23, 59, 59, 999);

    const previousTasksCompleted = await prisma.task.count({
      where: {
        assignedBy: managerUUID,
        status: {
          category: "completed",
        },
        updatedAt: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
    });

    const taskCompletionChange =
      previousTasksCompleted > 0
        ? Math.round(
            ((recentTasksCompleted - previousTasksCompleted) /
              previousTasksCompleted) *
              100
          )
        : recentTasksCompleted > 0
        ? 100
        : 0;

    return NextResponse.json({
      overview: {
        totalWorkers,
        totalProjects,
        totalTasks,
        totalNotifications,
        completedTasks,
        activeProjects,
        pendingTasks,
        taskCompletionRate,
        recentChats,
        recentTasksCreated,
        recentTasksCompleted,
        taskCompletionChange,
      },
      trends: {
        taskCreation: taskTrends.map((trend) => ({
          date: trend.date,
          count: trend._count.id,
        })),
        taskCompletion: completedTaskTrends.map((trend) => ({
          date: trend.date,
          count: trend._count.id,
        })),
      },
      workers: workerProductivity.map((worker) => ({
        id: worker.id,
        name: worker.name,
        taskCount: worker._count.tasks,
        jobRole: worker.jobRole,
      })),
      projectStatuses: projectStatuses.map((status) => ({
        status: status.status,
        count: status._count.id,
      })),
      taskPriorities: taskPriorities.map((priority) => ({
        priority: priority.priority,
        count: priority._count.id,
      })),
      // Debug info to see raw completed task data
      debugCompletedRows: completedTaskRows.slice(0, 10).map((t, index) => ({
        index: index,
        updatedAt: t.updatedAt?.toISOString() || "null",
      })),
      debugCompletionCounts: Object.entries(completionCounts).slice(0, 10),
      debugStatusId3Count: await prisma.task.count({
        where: {
          assignedBy: managerUUID,
          statusId: 3,
          updatedAt: {
            not: null,
          },
        },
      }),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
