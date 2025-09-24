import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import crypto from "crypto";
import { putNotification, getNotifications } from "@/lib/dynamodb";
import { createWorkerMessageNotification } from "@/lib/notifications";

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
        { status: 400 },
      );
    }

    if (actorType === "worker") {
      // Workers can chat with other workers under same manager
      // Also allow workers to chat with their manager by passing receiverId in form "manager:<uuid>"
      const currentWorkerId = actorId as string;

      const currentWorker = await prisma.worker.findUnique({
        where: { id: currentWorkerId },
        select: { managerDeviceUUID: true },
      });

      if (!currentWorker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 },
        );
      }

      if (receiverId.startsWith("manager:")) {
        // Manager receiver — verify manager owns this worker
        const managerId = receiverId.split(":")[1];
        if (currentWorker.managerDeviceUUID !== managerId) {
          return NextResponse.json(
            { error: "Can only chat with your own manager" },
            { status: 403 },
          );
        }
      } else {
        // Receiver is a worker — verify both under same manager
        const receiverWorker = await prisma.worker.findUnique({
          where: { id: receiverId },
          select: { managerDeviceUUID: true },
        });

        if (!receiverWorker) {
          return NextResponse.json(
            { error: "Worker not found" },
            { status: 404 },
          );
        }

        if (
          currentWorker.managerDeviceUUID !== receiverWorker.managerDeviceUUID
        ) {
          return NextResponse.json(
            { error: "Can only chat with workers under same manager" },
            { status: 403 },
          );
        }
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
          { status: 404 },
        );
      }

      if (receiverWorker.managerDeviceUUID !== managerId) {
        return NextResponse.json(
          { error: "Can only chat with your own workers" },
          { status: 403 },
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
             COALESCE(r.name, 'Manager') as receiver_name,
             COALESCE(r.email, 'manager@local') as receiver_email
      FROM chats c
      LEFT JOIN workers s ON c.sender_id = s.id
      -- manager records were removed from RDS; don't join managers table
      LEFT JOIN workers r ON c.receiver_id = r.id
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
      { status: 500 },
    );
  }
}

// New endpoint: GET /api/chat/unread-count - returns unread notifications count for current worker
export async function HEAD(request: NextRequest) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    if (actorType !== "worker" || !actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await getNotifications(actorId, 50);
    const unread = notifications.filter((n) => n.status === "unread").length;
    return NextResponse.json({ unread });
  } catch (error) {
    console.error("HEAD /api/chat/unread-count error:", error);
    return NextResponse.json({ unread: 0 });
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
        { status: 400 },
      );
    }

    if (actorType === "worker") {
      // Workers can chat with other workers under same manager
      // Also allow workers to chat with their manager by passing receiverId in form "manager:<uuid>"
      const currentWorkerId = actorId as string;

      // Verify sender exists and fetch manager UUID
      const currentWorker = await prisma.worker.findUnique({
        where: { id: currentWorkerId },
        select: { managerDeviceUUID: true },
      });

      if (!currentWorker) {
        return NextResponse.json(
          { error: "Worker not found" },
          { status: 404 },
        );
      }

      if (receiverId.startsWith("manager:")) {
        // Sending to manager - validate manager ownership
        const managerId = receiverId.split(":")[1];
        if (currentWorker.managerDeviceUUID !== managerId) {
          return NextResponse.json(
            { error: "Can only chat with your own manager" },
            { status: 403 },
          );
        }
      } else {
        // Receiver is a worker — verify both under same manager
        const receiverWorker = await prisma.worker.findUnique({
          where: { id: receiverId },
          select: { managerDeviceUUID: true },
        });

        if (!receiverWorker) {
          return NextResponse.json(
            { error: "Worker not found" },
            { status: 404 },
          );
        }

        if (
          currentWorker.managerDeviceUUID !== receiverWorker.managerDeviceUUID
        ) {
          return NextResponse.json(
            { error: "Can only chat with workers under same manager" },
            { status: 403 },
          );
        }
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
          { status: 404 },
        );
      }

      if (receiverWorker.managerDeviceUUID !== managerId) {
        return NextResponse.json(
          { error: "Can only chat with your own workers" },
          { status: 403 },
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

    // Resolve receiver info if receiver is a worker; manager identifiers won't be present in RDS
    let receiver: { id: string; name: string; email: string } | null = null;
    if (!receiverId.startsWith("manager:")) {
      receiver = await prisma.worker.findUnique({
        where: { id: receiverId },
        select: { id: true, name: true, email: true },
      });
    } else {
      // Generic manager identity for responses
      receiver = {
        id: receiverId,
        name: "Manager",
        email: "manager@local",
      };
    }

    // If sender is manager, create a DynamoDB notification for the worker (unread)
    if (actorType === "manager" && receiver) {
      try {
        await putNotification({
          userId: receiver.id,
          type: "worker_message",
          message: `Message from Manager: ${content.substring(0, 120)}`,
          status: "unread",
          triggeredBy: `manager:${actorId}`,
        });
      } catch (ndErr) {
        console.error("Failed to enqueue chat notification:", ndErr);
      }
    }

    // If sender is worker and receiver is manager, create a DynamoDB notification for the manager
    if (actorType === "worker" && receiverId.startsWith("manager:")) {
      try {
        const managerId = receiverId.split(":")[1];
        const workerInfo = await prisma.worker.findUnique({
          where: { id: actorId as string },
          select: { name: true },
        });

        if (workerInfo) {
          await createWorkerMessageNotification(
            managerId,
            actorId as string,
            workerInfo.name,
            content,
          );
          console.log(
            `Created worker message notification for manager ${managerId}`,
          );
        }
      } catch (ndErr) {
        console.error("Failed to create worker->manager notification:", ndErr);
      }
    }

    // If sender is worker and receiver is another worker, create a notification for the receiver
    if (actorType === "worker" && !receiverId.startsWith("manager:")) {
      try {
        await putNotification({
          userId: receiverId,
          type: "chat",
          message: content.substring(0, 120),
          status: "unread",
          triggeredBy: actorId as string,
        });
      } catch (ndErr) {
        console.error("Failed to create worker->worker notification:", ndErr);
      }
    }

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
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 },
    );
  }
}
