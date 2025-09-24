import { NextResponse } from "next/server";
import {
  getNotifications,
  queryManagerNotifications,
  markNotificationReadForUser,
} from "@/lib/dynamodb";

export async function POST(req: Request) {
  try {
    const headers = Object.fromEntries(req.headers.entries());
    const actorType = headers["x-actor-type"] || headers["x_actor_type"];
    const actorId = headers["x-actor-id"] || headers["x_actor_id"];

    if (!actorType || !actorId) {
      return NextResponse.json(
        { error: "Missing actor headers" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const senderId = body.senderId;
    if (!senderId) {
      return NextResponse.json({ error: "senderId required" }, { status: 400 });
    }

    if (actorType === "manager") {
      const managerId = String(actorId);
      const items = await queryManagerNotifications(managerId, 500);
      const unreadForSender = items.filter(
        (it) =>
          it.status === "unread" &&
          it.type === "worker_message" &&
          it.workerId === senderId,
      );
      await Promise.all(
        unreadForSender.map((it) =>
          markNotificationReadForUser(`manager:${managerId}`, it.notifId),
        ),
      );
      return NextResponse.json({
        success: true,
        marked: unreadForSender.length,
      });
    }

    // worker actor - mark notifications in their own partition triggered by senderId
    const workerId = String(actorId);
    const items = await getNotifications(workerId, 200);
    const unreadFromSender = items.filter(
      (it) => it.status === "unread" && it.triggeredBy === senderId,
    );
    await Promise.all(
      unreadFromSender.map((it) =>
        markNotificationReadForUser(workerId, it.notifId),
      ),
    );
    return NextResponse.json({
      success: true,
      marked: unreadFromSender.length,
    });
  } catch (err) {
    console.error("mark-read-sender error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
