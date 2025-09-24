import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getManagerNotifications,
  markNotificationAsRead,
} from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    // Get manager UUID from session headers first, fallback to query params or cookies
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    let managerDeviceUUID: string | null = null;

    if (actorType === "manager" && actorId) {
      managerDeviceUUID = actorId;
    } else {
      // Fallback to query params or cookies for compatibility
      const url = new URL(request.url);
      const qs = url.searchParams.get("managerDeviceUUID");
      const cookieJar = await cookies();
      const cookieManager = cookieJar.get("managerDeviceUUID")?.value;
      managerDeviceUUID = qs || cookieManager || null;
    }

    if (!managerDeviceUUID) {
      return NextResponse.json(
        { error: "Missing managerDeviceUUID or unauthorized" },
        { status: 400 },
      );
    }

    const items = await getManagerNotifications(managerDeviceUUID, 50);

    // Map to a simplified shape usable by the client
    const mapped = items.map((it) => ({
      notifId: it.notifId,
      type: it.type,
      message: it.message,
      workerId: it.workerId,
      taskId: it.taskId,
      createdAt: it.createdAt,
      status: it.status,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get manager UUID from session headers first, fallback to query params or cookies
    const actorType = request.headers.get("x-actor-type");
    const actorId = request.headers.get("x-actor-id");

    let managerDeviceUUID: string | null = null;

    if (actorType === "manager" && actorId) {
      managerDeviceUUID = actorId;
    } else {
      // Fallback to query params or cookies for compatibility
      const url = new URL(request.url);
      const qs = url.searchParams.get("managerDeviceUUID");
      const cookieJar = await cookies();
      const cookieManager = cookieJar.get("managerDeviceUUID")?.value;
      managerDeviceUUID = qs || cookieManager || null;
    }

    if (!managerDeviceUUID) {
      return NextResponse.json(
        { error: "Missing managerDeviceUUID or unauthorized" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { notifId } = body;
    if (!notifId) {
      return NextResponse.json(
        { error: "notifId is required" },
        { status: 400 },
      );
    }

    const ok = await markNotificationAsRead(managerDeviceUUID, notifId);
    if (!ok) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
