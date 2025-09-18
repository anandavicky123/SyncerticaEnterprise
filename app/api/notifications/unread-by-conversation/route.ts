import { NextResponse } from "next/server";
import { getNotifications, queryManagerNotifications } from "@/lib/dynamodb";

export async function GET(req: Request) {
  try {
    const headers = Object.fromEntries(req.headers.entries());
    const actorType = headers["x-actor-type"] || headers["x_actor_type"];
    const actorId = headers["x-actor-id"] || headers["x_actor_id"];

    if (!actorType || !actorId) {
      return NextResponse.json(
        { error: "Missing actor headers" },
        { status: 400 }
      );
    }

    if (actorType === "manager") {
      const managerId = String(actorId);
      const items = await queryManagerNotifications(managerId, 500);
      // group unread worker_message by workerId
      const byWorker: Record<string, number> = {};
      for (const it of items) {
        if (
          it.type === "worker_message" &&
          it.status === "unread" &&
          it.workerId
        ) {
          byWorker[it.workerId] = (byWorker[it.workerId] || 0) + 1;
        }
      }

      const total = Object.values(byWorker).reduce((s, v) => s + v, 0);
      return NextResponse.json({ byWorker, total });
    }

    // For workers, return empty mapping (can be extended later)
    const workerId = String(actorId);
    const items = await getNotifications(workerId, 200);
    const bySender: Record<string, number> = {};
    for (const it of items) {
      if (it.status === "unread" && it.triggeredBy) {
        bySender[it.triggeredBy] = (bySender[it.triggeredBy] || 0) + 1;
      }
    }

    return NextResponse.json({
      bySender,
      total: Object.values(bySender).reduce((s, v) => s + v, 0),
    });
  } catch (err) {
    console.error("unread-by-conversation error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
