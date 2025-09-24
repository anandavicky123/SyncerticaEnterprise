import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/dynamodb";
import { markNotificationReadForUser } from "@/lib/dynamodb";

// This route marks all unread notifications for the current manager as read.
export async function POST(req: Request) {
  try {
    // Determine manager UUID from headers or cookies
    // Expecting header: x-actor-type='manager' and x-actor-id='<uuid>'
    const headers = Object.fromEntries(req.headers.entries());
    const actorType = headers["x-actor-type"] || headers["x_actor_type"];
    const actorId = headers["x-actor-id"] || headers["x_actor_id"];

    if (!actorType || !actorId) {
      return NextResponse.json(
        { success: false, error: "Missing actor headers" },
        { status: 400 },
      );
    }

    const actor = String(actorId);

    // Use getNotifications which supports 'manager:<uuid>' or plain worker id
    const queryId = actorType === "manager" ? `manager:${actor}` : actor;
    const notifications = await getNotifications(queryId, 300);
    const unread = (notifications || []).filter((n) => n.status === "unread");

    await Promise.all(
      unread.map((n) => markNotificationReadForUser(queryId, n.notifId)),
    );

    return NextResponse.json({ success: true, marked: unread.length });
  } catch (err) {
    console.error("mark-all-read error", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 },
    );
  }
}
