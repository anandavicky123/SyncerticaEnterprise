import { NextResponse } from "next/server";
import { createOrGetManager } from "../../../../lib/auth";

// Manager auth route: accepts POST with { deviceUUID, name }
// Uses createOrGetManager which will persist manager (Prisma) and create session (DynamoDB)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const deviceUUID = body?.deviceUUID || null;
    const name = body?.name || "Manager";

    // Basic validation
    if (!deviceUUID) {
      return NextResponse.json({ error: "deviceUUID is required" }, { status: 400 });
    }

  const { manager, sessionId } = await createOrGetManager(deviceUUID, name);

  const res = NextResponse.json({ sessionId, manager });
  // Set cookie server-side to avoid client-side race conditions
  res.cookies.set("session-id", sessionId, { path: "/", maxAge: 24 * 60 * 60 });
  return res;
  } catch (err) {
    console.error("Error in /api/auth/manager POST:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
