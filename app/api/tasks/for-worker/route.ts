import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    if (actorType !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized - Manager access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");

    if (!workerId) {
      return NextResponse.json(
        { error: "workerId query param is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const tasks = await db.getAllTasks(actorId || undefined);

    const filtered = tasks
      .filter((t) => t.assignedTo === workerId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("GET /api/tasks/for-worker error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks for worker" },
      { status: 500 }
    );
  }
}
