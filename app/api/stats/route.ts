import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/database";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const db = getDatabase();

    // Try to get managerDeviceUUID from query string first, then cookies
    const url = new URL(request.url);
    const qsManagerUUID = url.searchParams.get("managerDeviceUUID");
  const cookieJar = await cookies();
  const cookieManager = cookieJar.get("managerDeviceUUID")?.value;
  const managerDeviceUUID = qsManagerUUID || cookieManager || null;

    console.debug("/api/stats - managerDeviceUUID:", managerDeviceUUID);

    if (!managerDeviceUUID) {
      return NextResponse.json(
        { error: "Missing managerDeviceUUID" },
        { status: 400 }
      );
    }

    // Get all data using the DatabaseManager methods with proper error handling
    const [tasks, workers, projects] = await Promise.all([
      db.getAllTasks(managerDeviceUUID).catch(() => []),
      db.getAllWorkers(managerDeviceUUID).catch(() => []),
      db.getAllProjects(managerDeviceUUID).catch(() => []),
    ]);

    // Initialize stats with default values
    const stats = {
      totalTasks: tasks.length,
      todoTasks: 0,
      doingTasks: 0,
      doneTasks: 0,
      blockedTasks: 0,
      totalWorkers: workers.length,
      totalProjects: projects.length,
      activeProjects: 0,
      completedProjects: 0,
      workersByRole: {
        "UI/UX Designer": 0,
        Developer: 0,
        "IT Supports": 0,
        QA: 0,
        "Data Analyst": 0,
      },
    };

    // Process task statistics
    if (Array.isArray(tasks)) {
      for (const task of tasks) {
        const status = task.status?.toLowerCase() ?? "";
        switch (status) {
          case "todo":
            stats.todoTasks++;
            break;
          case "doing":
            stats.doingTasks++;
            break;
          case "done":
            stats.doneTasks++;
            break;
          case "blocked":
            stats.blockedTasks++;
            break;
        }
      }
    }

    // Process worker statistics
    if (Array.isArray(workers)) {
      for (const worker of workers) {
        if (worker.jobRole && worker.jobRole in stats.workersByRole) {
          stats.workersByRole[
            worker.jobRole as keyof typeof stats.workersByRole
          ]++;
        }
      }
    }

    // Process project statistics
    if (Array.isArray(projects)) {
      for (const project of projects) {
        const statusId = project.statusId || 5; // Default to active
        switch (statusId) {
          case 5: // active
            stats.activeProjects++;
            break;
          case 7: // completed
            stats.completedProjects++;
            break;
          // Note: on-hold (6) and archived (8) don't map to existing counters
        }
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching database stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch database statistics" },
      { status: 500 }
    );
  }
}
