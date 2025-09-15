import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    if (!actorId || actorType !== "worker") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: actorId },
      select: {
        id: true,
        name: true,
        email: true,
        pronouns: true,
        jobRole: true,
        managerDeviceUUID: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: worker.id,
      name: worker.name,
      email: worker.email,
      pronouns: worker.pronouns || null,
      jobRole: worker.jobRole,
      managerDeviceUUID: worker.managerDeviceUUID,
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/workers/me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch worker" },
      { status: 500 }
    );
  }
}
