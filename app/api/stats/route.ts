import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/database";

export async function GET() {
  try {
    const db = getDatabase();

    // Extract managerDeviceUUID from cookies or session
    const managerDeviceUUID = "894a6f20-5d46-4d63-9cbe-dd2dd0dcd338"; // TODO: Get this from session

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
        Manager: 0,
        QA: 0,
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
        const status = project.status?.toLowerCase() ?? "";
        switch (status) {
          case "active":
            stats.activeProjects++;
            break;
          case "completed":
            stats.completedProjects++;
            break;
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
