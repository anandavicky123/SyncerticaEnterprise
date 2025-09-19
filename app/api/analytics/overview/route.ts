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

    // Get basic counts
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
      prisma.task.count({
        where: {
          assignedBy: managerUUID,
          status: {
            category: "completed",
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
            { sender: { managerDeviceUUID: managerUUID } },
            { receiver: { managerDeviceUUID: managerUUID } },
          ],
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Get task completion trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const taskTrends = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        assignedBy: managerUUID,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const completedTaskTrends = await prisma.task.groupBy({
      by: ["updatedAt"],
      where: {
        assignedBy: managerUUID,
        status: {
          category: "completed",
        },
        updatedAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        updatedAt: "asc",
      },
    });

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
          date: trend.createdAt,
          count: trend._count.id,
        })),
        taskCompletion: completedTaskTrends.map((trend) => ({
          date: trend.updatedAt,
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
