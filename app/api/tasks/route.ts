import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../lib/database";
import { createTaskUpdateNotification } from "../../../lib/notifications";

// GET /api/tasks - Get all tasks
export async function GET(request: NextRequest) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    if (!actorType || !actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = getDatabase();

    let managerDeviceUUID: string;

    if (actorType === "manager") {
      managerDeviceUUID = actorId;
    } else if (actorType === "worker") {
      const worker = await db.getWorkerById(actorId);
      if (!worker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 }
        );
      }
      managerDeviceUUID = worker.managerDeviceUUID;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const tasks = await db.getAllTasks(managerDeviceUUID);
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
      dueDate,
      tags,
      projectId,
    } = body;
    // Determine managerDeviceUUID from session headers (only managers can create tasks)
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    if (!actorType || !actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (actorType !== "manager") {
      return NextResponse.json(
        { error: "Only managers can create tasks" },
        { status: 403 }
      );
    }

    const managerdeviceuuid = actorId;

    if (!title || !description || !assignedTo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const task = await db.createTask(
      managerdeviceuuid,
      {
        title,
        description,
        status: status || "todo",
        priority: priority || "medium",
        managerdeviceuuid,
        assignedTo,
        dueDate,
        tags: tags || [],
      },
      projectId
    );

    // Retrieve project name for response
    let projectName: string | undefined = undefined;
    if (task && (task as any).projectId) {
      const proj = await db.getAllProjects(managerdeviceuuid);
      const found = proj.find((p) => p.id === (task as any).projectId);
      projectName = found?.name;
    }
    // Attach projectName for client convenience
    const taskWithProject = { ...(task as any), projectName };

    return NextResponse.json(taskWithProject, { status: 201 });
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

    // Get actor information from headers
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    const db = getDatabase();

    // Get the current task before update to check if status changed
    const currentTask = await db.getTaskById(id);
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If a worker changed the status, set or clear the updatedAt field so
    // the RDS `tasks.updatedat` column reflects when the worker marked it completed.
    // - When a worker marks a task as "done" (Completed), set updatedAt to now.
    // - When a worker changes away from a completed status, clear updatedAt (set null).
    try {
      const actorType = request.headers.get("x-actor-type");
      // Only mutate updatedAt when a worker (not manager/system) performs the action
      if (
        actorType === "worker" &&
        updates.status &&
        updates.status !== currentTask.status
      ) {
        // UI uses status value "done" for completed. Set timestamp when moving to done,
        // otherwise clear the timestamp when moving away from done.
        if (updates.status === "done") {
          (updates as any).updatedAt = new Date().toISOString();
        } else {
          // Explicitly set to null to clear the DB column
          (updates as any).updatedAt = null;
        }
      }
    } catch (e) {
      console.debug("Failed to prepare updatedAt on task update", e);
    }

    const success = await db.updateTask(id, updates);

    if (!success) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If a worker updated the task status, create a notification for the manager
    if (
      actorType === "worker" &&
      actorId &&
      updates.status &&
      updates.status !== currentTask.status
    ) {
      try {
        // Get worker information
        const worker = await db.getWorkerById(actorId);
        if (worker) {
          await createTaskUpdateNotification(
            worker.managerDeviceUUID,
            actorId,
            id,
            worker.name,
            currentTask.title,
            updates.status
          );
          console.log(
            `Created task update notification for manager ${worker.managerDeviceUUID}`
          );
        }
      } catch (notifError) {
        console.error("Failed to create task update notification:", notifError);
        // Don't fail the task update if notification fails
      }
    }

    const updatedTask = await db.getTaskById(id);
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
    const success = await db.deleteTask(id);

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
