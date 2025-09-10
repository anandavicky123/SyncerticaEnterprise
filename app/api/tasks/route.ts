import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../lib/database";

// GET /api/tasks - Get all tasks
export async function GET() {
  try {
    const db = getDatabase();
    const tasks = db.getAllTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      managerdeviceuuid,
      dueDate,
      estimatedHours,
      tags,
    } = body;

    if (!title || !description || !assignedTo || !managerdeviceuuid) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const task = await db.createTask(managerdeviceuuid, {
      title,
      description,
      status: status || "todo",
      priority: priority || "medium",
      assignedTo,
      dueDate,
      estimatedHours,
      tags: tags || [],
      actualHours: 0,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks - Update a task
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const success = db.updateTask(id, updates);

    if (!success) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updatedTask = db.getTaskById(id);
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const success = db.deleteTask(id);

    if (!success) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
