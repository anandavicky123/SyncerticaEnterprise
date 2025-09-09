import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../lib/database";

// Temporary hardcoded manager UUID - should be replaced with actual authentication
const TEMP_MANAGER_UUID = "123e4567-e89b-12d3-a456-426614174000";

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const db = getDatabase();
    const projects = await db.getAllProjects(TEMP_MANAGER_UUID);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, repository, status } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const project = await db.createProject(
      {
        name,
        description,
        repository,
        status: status || "active",
      },
      TEMP_MANAGER_UUID
    );

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
