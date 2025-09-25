import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getNotifications, queryManagerNotifications } from "@/lib/dynamodb";

// Force Node.js runtime for AWS SDK compatibility
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    let unread = 0;

    if (actorType === "manager" && actorId) {
      // manager -> query manager notifications
      const items = await queryManagerNotifications(actorId, 100);
      unread = items.filter((i) => i.status === "unread").length;
      return NextResponse.json({ unread });
    }

    // fallback: allow worker to read their own unread notifications
    let userId: string | null = null;
    if (actorType === "worker" && actorId) {
      userId = actorId;
    } else {
      // try query param or cookie
      const url = new URL(request.url);
      const qs = url.searchParams.get("userId");
      const cookieJar = await cookies();
      const cookieUser = cookieJar.get("userId")?.value;
      userId = qs || cookieUser || null;
    }

    if (!userId) {
      return NextResponse.json({ unread: 0 });
    }

    const items = await getNotifications(userId, 100);
    unread = items.filter((i) => i.status === "unread").length;

    return NextResponse.json({ unread });
  } catch (error) {
    console.error("GET /api/notifications/unread error:", error);
    return NextResponse.json({ unread: 0 }, { status: 500 });
  }
}
