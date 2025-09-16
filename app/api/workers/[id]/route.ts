"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { z } from "zod";

const updateWorkerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  pronouns: z.string().nullable(),
  jobRole: z.enum(["UI/UX Designer", "Developer", "Manager", "QA"]),
  email: z.string().email("Invalid email"),
});

export async function PUT(req: Request, context: any) {
  const { params } = context;
  try {
    const actorType = req.headers.get("x-actor-type");

    if (actorType !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized - Manager access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = updateWorkerSchema.parse(body);

    // Update worker
    const worker = await prisma.worker.update({
      where: {
        id: params.id,
      },
      data: {
        name: validatedData.name,
        pronouns: validatedData.pronouns,
        jobRole: validatedData.jobRole,
        email: validatedData.email,
      },
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
    console.error("Error updating worker:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update worker" },
      { status: 500 }
    );
  }
}
