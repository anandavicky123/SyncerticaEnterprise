import { NextResponse } from "next/server";
import { createOrGetManager } from "../../../../lib/auth";

// Manager auth route: accepts POST with { deviceUUID, name }
// Uses createOrGetManager which will persist manager (Prisma) and create session (DynamoDB)
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    // Log raw body for debugging
    console.log("/api/auth/manager raw body:", raw);

    let body: any = null;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (parseErr) {
      console.error("/api/auth/manager JSON parse error:", parseErr);
      return NextResponse.json({ error: "Malformed JSON in request body" }, { status: 400 });
    }

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
    // Include the underlying error message to aid debugging on Vercel.
    // NOTE: Be cautious exposing internal errors in production — remove or gate this later.
    const message = err instanceof Error ? err.message : "Invalid request";
    const body: Record<string, any> = { error: message };
    if (process.env.NODE_ENV === "development" && err instanceof Error) {
      body.stack = err.stack;
    }
    // Server-side errors should be 500
    return NextResponse.json(body, { status: 500 });
  }
}
