"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";

const updateWorkerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  pronouns: z.string().nullable(),
  jobRole: z.enum(["UI/UX Designer", "Developer", "Manager", "QA"]),
  email: z.string().email("Invalid email"),
  password: z.string().min(8).optional(),
  githubUsername: z.string().nullable().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const actorType = req.headers.get("x-actor-type");

    if (actorType !== "manager") {
      return NextResponse.json(
        { error: "Unauthorized - Manager access required" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const validatedData = updateWorkerSchema.parse(body);

    const updateData: any = {
      name: validatedData.name,
      pronouns: validatedData.pronouns,
      jobRole: validatedData.jobRole,
      email: validatedData.email,
    };

    if (validatedData.password) {
      const hashed = await hashPassword(validatedData.password);
      updateData.passwordHash = hashed;
    }

    if (Object.prototype.hasOwnProperty.call(validatedData, "githubUsername")) {
      updateData.github_username = validatedData.githubUsername ?? null;
    }

    // Update worker
    const worker = await prisma.worker.update({
      where: {
        id: resolvedParams.id,
      },
      data: updateData,
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
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update worker" },
      { status: 500 },
    );
  }
}
