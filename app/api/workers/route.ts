import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/database";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const createWorkerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  pronouns: z.string().nullable(),
  jobRole: z.enum([
    "UI/UX Designer",
    "Developer",
    "IT Supports",
    "QA",
    "Data Analyst",
  ]),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  githubUsername: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get session from headers (set by middleware)
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");
    console.log("GET /api/workers - headers:", {
      "x-actor-type": actorType,
      "x-actor-id": actorId,
    });

    if (actorType === "manager") {
      // Managers can see all their workers
      const workers = await prisma.worker.findMany({
        where: {
          managerDeviceUUID: actorId!,
        },
        select: {
          id: true,
          name: true,
          pronouns: true,
          jobRole: true,
          email: true,
          github_username: true,
          createdAt: true,
          updatedAt: true,
          managerDeviceUUID: true,
        },
      });

      return NextResponse.json(workers);
    } else if (actorType === "worker") {
      // Workers can see other workers under the same manager
      const currentWorker = await prisma.worker.findUnique({
        where: { id: actorId! },
        select: { managerDeviceUUID: true },
      });

      if (!currentWorker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 },
        );
      }

      const coWorkers = await prisma.worker.findMany({
        where: {
          managerDeviceUUID: currentWorker.managerDeviceUUID,
        },
        select: {
          id: true,
          name: true,
          pronouns: true,
          jobRole: true,
          email: true,
          github_username: true,
          createdAt: true,
          updatedAt: true,
          managerDeviceUUID: true,
        },
      });

      return NextResponse.json(coWorkers);
    } else {
      return NextResponse.json(
        { error: "Unauthorized - Manager or Worker access required" },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error("Get workers error:", error);
    return NextResponse.json(
      { error: "Failed to get workers" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get session from headers (set by middleware)
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    if (actorType !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized - Manager access required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("id");

    if (!workerId) {
      return NextResponse.json(
        { error: "Worker ID is required" },
        { status: 400 },
      );
    }

    await prisma.worker.delete({
      where: {
        id: workerId,
        managerDeviceUUID: actorId!,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Worker deleted successfully",
    });
  } catch (error) {
    console.error("Delete worker error:", error);

    if (error instanceof Error && error.message === "WORKER_NOT_FOUND") {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete worker" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const actorType = req.headers.get("x-actor-type");
    const actorId = req.headers.get("x-actor-id");
    const sessionId = req.headers.get("x-session-id");
    console.log("POST /api/workers - headers:", {
      "x-session-id": sessionId,
      "x-actor-type": actorType,
      "x-actor-id": actorId,
    });

    if (!sessionId || !actorType || !actorId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session found" },
        { status: 401 },
      );
    }

    if (actorType !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized - Manager access required" },
        { status: 401 },
      );
    }

    const body = await req.json();
    console.log("POST /api/workers - body:", body);
    const validatedData = createWorkerSchema.parse(body);

    // Check worker limit (7 workers per manager)
    const workerCount = await prisma.worker.count({
      where: { managerDeviceUUID: actorId! },
    });

    if (workerCount >= 7) {
      throw new Error("WORKER_LIMIT_REACHED");
    }

    // Check if email is already taken
    const existingWorker = await prisma.worker.findUnique({
      where: { email: validatedData.email },
    });

    if (existingWorker) {
      return NextResponse.json(
        { error: "A worker with this email already exists" },
        { status: 400 },
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create worker
    const createData: any = {
      id: crypto.randomUUID(), // Generate a random UUID for the worker
      name: validatedData.name,
      pronouns: validatedData.pronouns,
      jobRole: validatedData.jobRole,
      email: validatedData.email,
      passwordHash: hashedPassword,
      managerDeviceUUID: actorId!,
    };
    if (validatedData.githubUsername !== undefined) {
      createData.github_username = validatedData.githubUsername ?? null;
    }

    const worker = await prisma.worker.create({
      data: createData,
      select: {
        id: true,
        name: true,
        pronouns: true,
        jobRole: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        managerDeviceUUID: true,
      },
    });

    return NextResponse.json(worker);
  } catch (error) {
    console.error("Error creating worker:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    // Handle Prisma unique constraint errors
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return NextResponse.json(
        { error: "A worker with this email already exists" },
        { status: 400 },
      );
    }

    // Handle worker limit reached
    if (error instanceof Error && error.message === "WORKER_LIMIT_REACHED") {
      return NextResponse.json(
        { error: "Worker limit reached. Please upgrade to add more workers." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error while creating worker" },
      { status: 500 },
    );
  }
}
