import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma.js";

export async function POST(request: NextRequest) {
  try {
    const { managerUUID } = await request.json();

    if (!managerUUID) {
      return NextResponse.json(
        { error: "Manager UUID is required" },
        { status: 400 },
      );
    }

    // Get workers for this manager to generate chats
    const workers = await prisma.worker.findMany({
      where: { managerDeviceUUID: managerUUID },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (workers.length === 0) {
      return NextResponse.json(
        { error: "No workers found for this manager" },
        { status: 404 },
      );
    }

    // Check if chats already exist for this manager's workers
    const workerIds = workers.map(
      (w: { id: string; name: string; email: string }) => w.id,
    );
    const existingChats = await prisma.chats.count({
      where: {
        OR: [
          { senderId: managerUUID },
          { receiverId: managerUUID },
          { senderId: { in: workerIds } },
          { receiverId: { in: workerIds } },
        ],
      },
    });

    if (existingChats > 0) {
      return NextResponse.json({
        success: true,
        message: "Chat data already exists",
        count: existingChats,
      });
    }

    // Dynamically import the generateChats function
    const { generateChats } = await import(
      "../../../../scripts/generate-mock-data"
    );

    // Generate chat data
    const chats = generateChats(managerUUID, workers, false); // verbose = false for API

    // Insert chats
    for (const chat of chats) {
      await prisma.chats.create({ data: chat });
    }

    return NextResponse.json({
      success: true,
      message: "Chat data generated successfully",
      count: chats.length,
    });
  } catch (error) {
    console.error("Error generating chat data:", error);
    return NextResponse.json(
      { error: "Failed to generate chat data" },
      { status: 500 },
    );
  }
}
