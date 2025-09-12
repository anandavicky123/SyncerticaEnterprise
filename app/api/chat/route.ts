import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import crypto from "crypto";

// GET /api/chat?receiverId=...  - returns chats between current user and receiver
// POST /api/chat - create a chat message { receiverId, content }

export async function GET(request: NextRequest) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    const url = new URL(request.url);
    const receiverId = url.searchParams.get("receiverId");

    if (!receiverId) {
      return NextResponse.json(
        { error: "receiverId is required" },
        { status: 400 }
      );
    }

    if (actorType === "worker") {
      // Workers can chat with other workers under same manager
      const currentWorkerId = actorId as string;

      // Verify both sender and receiver are workers under same manager
      const currentWorker = await prisma.worker.findUnique({
        where: { id: currentWorkerId },
        select: { managerDeviceUUID: true },
      });

      const receiverWorker = await prisma.worker.findUnique({
        where: { id: receiverId },
        select: { managerDeviceUUID: true },
      });

      if (!currentWorker || !receiverWorker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 }
        );
      }

      if (
        currentWorker.managerDeviceUUID !== receiverWorker.managerDeviceUUID
      ) {
        return NextResponse.json(
          { error: "Can only chat with workers under same manager" },
          { status: 403 }
        );
      }
    } else if (actorType === "manager") {
      // Managers can chat with their workers
      const managerId = actorId as string;

      const receiverWorker = await prisma.worker.findUnique({
        where: { id: receiverId },
        select: { managerDeviceUUID: true },
      });

      if (!receiverWorker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 }
        );
      }

      if (receiverWorker.managerDeviceUUID !== managerId) {
        return NextResponse.json(
          { error: "Can only chat with your own workers" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // For managers chatting with workers, we need to treat the manager as a special case
    let currentUserId: string;
    if (actorType === "worker") {
      currentUserId = actorId as string;
    } else {
      // For managers, we use a special identifier
      currentUserId = `manager:${actorId}`;
    }

    // Fetch chats between current user and receiver (both directions)
    const chats: Array<{
      id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      created_at: Date;
      sender_name: string;
      sender_email: string;
      receiver_name: string;
      receiver_email: string;
    }> = await prisma.$queryRaw`
      SELECT c.id, c.sender_id, c.receiver_id, c.content, c.created_at,
             COALESCE(s.name, 'Manager') as sender_name,
             COALESCE(s.email, 'manager@local') as sender_email,
             r.name as receiver_name, r.email as receiver_email
      FROM chats c
      LEFT JOIN workers s ON c.sender_id = s.id
      -- manager records were removed from RDS; don't join managers table
      JOIN workers r ON c.receiver_id = r.id
      WHERE (c.sender_id = ${currentUserId} AND c.receiver_id = ${receiverId})
         OR (c.sender_id = ${receiverId} AND c.receiver_id = ${currentUserId})
      ORDER BY c.created_at ASC
    `;

    const mapped = chats.map((chat) => ({
      id: chat.id,
      senderId: chat.sender_id,
      receiverId: chat.receiver_id,
      sender: {
        id: chat.sender_id,
        name: chat.sender_name,
        email: chat.sender_email,
      },
      receiver: {
        id: chat.receiver_id,
        name: chat.receiver_name,
        email: chat.receiver_email,
      },
      content: chat.content,
      createdAt: chat.created_at.toISOString(),
      isFromCurrentUser: chat.sender_id === currentUserId,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: "receiverId and content are required" },
        { status: 400 }
      );
    }

    if (actorType === "worker") {
      // Workers can chat with other workers under same manager
      const currentWorkerId = actorId as string;

      // Verify both sender and receiver exist and are under same manager
      const currentWorker = await prisma.worker.findUnique({
        where: { id: currentWorkerId },
        select: { managerDeviceUUID: true },
      });

      const receiverWorker = await prisma.worker.findUnique({
        where: { id: receiverId },
        select: { managerDeviceUUID: true },
      });

      if (!currentWorker || !receiverWorker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 }
        );
      }

      if (
        currentWorker.managerDeviceUUID !== receiverWorker.managerDeviceUUID
      ) {
        return NextResponse.json(
          { error: "Can only chat with workers under same manager" },
          { status: 403 }
        );
      }
    } else if (actorType === "manager") {
      // Managers can chat with their workers
      const managerId = actorId as string;

      const receiverWorker = await prisma.worker.findUnique({
        where: { id: receiverId },
        select: { managerDeviceUUID: true },
      });

      if (!receiverWorker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 }
        );
      }

      if (receiverWorker.managerDeviceUUID !== managerId) {
        return NextResponse.json(
          { error: "Can only chat with your own workers" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // For managers chatting with workers, we need to treat the manager as a special case
    let currentUserId: string;
    if (actorType === "worker") {
      currentUserId = actorId as string;
    } else {
      // For managers, we use a special identifier
      currentUserId = `manager:${actorId}`;
    }

    // Create the chat message
    const id = crypto.randomUUID();
    const inserted: Array<{
      id: string;
      sender_id: string;
      receiver_id: string;
      content: string;
      created_at: Date;
    }> = await prisma.$queryRaw`
      INSERT INTO chats (id, sender_id, receiver_id, content, created_at)
      VALUES (${id}, ${currentUserId}, ${receiverId}, ${content}, NOW())
      RETURNING id, sender_id, receiver_id, content, created_at
    `;

    const chat = inserted[0];

    // Get sender and receiver info
    let sender: { id: string; name: string; email: string } | null = null;

    if (actorType === "worker") {
      sender = await prisma.worker.findUnique({
        where: { id: actorId as string },
        select: { id: true, name: true, email: true },
      });
    } else if (actorType === "manager") {
      // Manager profile fields were removed from RDS; use a generic manager identity
      sender = {
        id: `manager:${actorId}`,
        name: "Manager",
        email: "manager@local",
      };
    }

    const receiver = await prisma.worker.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json(
      {
        id: chat.id,
        senderId: chat.sender_id,
        receiverId: chat.receiver_id,
        sender,
        receiver,
        content: chat.content,
        createdAt: chat.created_at.toISOString(),
        isFromCurrentUser: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
