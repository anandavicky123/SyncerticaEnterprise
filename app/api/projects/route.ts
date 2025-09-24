import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../lib/database";

// GET /api/projects - Get all projects
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
      // Manager requests should return projects for their own managerDeviceUUID
      managerDeviceUUID = actorId;
    } else if (actorType === "worker") {
      // Workers should only see projects for their manager
      const worker = await db.getWorkerById(actorId);
      if (!worker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 },
        );
      }
      managerDeviceUUID = worker.managerDeviceUUID;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const projects = await db.getAllProjects(managerDeviceUUID);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

// POST /api/projects - Create a new project (managers only)
export async function POST(request: NextRequest) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    if (!actorType || !actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (actorType !== "manager") {
      return NextResponse.json(
        { error: "Only managers can create projects" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, description, repository, statusId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 },
      );
    }

    const db = getDatabase();
    const project = await db.createProject(
      {
        name,
        description,
        repository,
        statusId: statusId || 5, // Default to active
      },
      actorId,
    );

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
