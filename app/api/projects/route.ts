import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../lib/database";

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const db = getDatabase();
    const projects = db.getAllProjects();
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
    const project = db.createProject({
      name,
      description,
      repository,
      status: status || "active",
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
