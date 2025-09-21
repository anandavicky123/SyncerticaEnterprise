import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    if (!actorId || actorType !== "worker") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDatabase();

    // get all tasks for manager, then filter by assignedTo on worker side to avoid exposing other workers' details
    const allTasks = await db.getAllTasks();

    const workerTasks = allTasks
      .filter((t) => t.assignedTo === actorId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
        project: {
          // Don't expose full project; provide a safe placeholder if available
          name: t.managerdeviceuuid ? "Project" : "Unknown",
        },
        createdAt: t.createdAt,
        updatedAt: (t as any).updatedAt ?? null,
      }));

    return NextResponse.json(workerTasks);
  } catch (error) {
    console.error("GET /api/tasks/worker error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
