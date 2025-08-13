import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../lib/database";

// GET /api/workers - Get all workers
export async function GET() {
  try {
    const db = getDatabase();
    const workers = db.getAllWorkers();
    return NextResponse.json(workers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

// POST /api/workers - Create a new worker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pronouns, jobRole, email, avatar } = body;

    if (!name || !pronouns || !jobRole) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const worker = db.createWorker({
      name,
      pronouns,
      jobRole,
      email,
      avatar,
    });

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error("Error creating worker:", error);
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 }
    );
  }
}

// PUT /api/workers - Update a worker
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Worker ID is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const success = db.updateWorker(id, updates);

    if (!success) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const updatedWorker = db.getWorkerById(id);
    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error("Error updating worker:", error);
    return NextResponse.json(
      { error: "Failed to update worker" },
      { status: 500 }
    );
  }
}

// DELETE /api/workers - Delete a worker
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Worker ID is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const success = db.deleteWorker(id);

    if (!success) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Worker deleted successfully" });
  } catch (error) {
    console.error("Error deleting worker:", error);
    return NextResponse.json(
      { error: "Failed to delete worker" },
      { status: 500 }
    );
  }
}
