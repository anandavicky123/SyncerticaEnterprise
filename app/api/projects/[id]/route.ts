import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");
    if (!actorType || !actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const db = getDatabase();
    const managerDeviceUUID =
      actorType === "manager"
        ? actorId
        : (await db.getWorkerById(actorId!))?.managerDeviceUUID;
    if (!managerDeviceUUID) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const project = await db.getProjectById(resolvedParams.id, managerDeviceUUID);
    if (!project)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");
    if (actorType !== "manager" || !actorId) {
      return NextResponse.json(
        { error: "Only managers can update projects" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const updates = await request.json();
    const db = getDatabase();
    const updated = await db.updateProject(resolvedParams.id, updates, actorId);
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");
    if (actorType !== "manager" || !actorId) {
      return NextResponse.json(
        { error: "Only managers can delete projects" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const db = getDatabase();
    const ok = await db.deleteProject(resolvedParams.id, actorId);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
