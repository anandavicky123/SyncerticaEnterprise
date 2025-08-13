import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/database";

export async function GET() {
  try {
    const db = getDatabase();

    // Get all data using the DatabaseManager methods
    const tasks = db.getAllTasks();
    const workers = db.getAllWorkers();
    const projects = db.getAllProjects();

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
    for (const task of tasks) {
      switch (task.status.toLowerCase()) {
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

    // Process worker statistics
    for (const worker of workers) {
      if (worker.jobRole in stats.workersByRole) {
        stats.workersByRole[
          worker.jobRole as keyof typeof stats.workersByRole
        ]++;
      }
    }

    // Process project statistics
    for (const project of projects) {
      switch (project.status.toLowerCase()) {
        case "active":
          stats.activeProjects++;
          break;
        case "completed":
          stats.completedProjects++;
          break;
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
