import { NextResponse } from "next/server";
import { createOrGetManager } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    // Parse request body safely
    const { deviceUUID, name } = await request.json().catch(() => ({}))

    if (!deviceUUID) {
      return NextResponse.json(
        { error: "deviceUUID is required" },
        { status: 400 }
      )
    }

    // Call your helper function
    const { manager, sessionId } = await createOrGetManager(
      deviceUUID,
      name || "Manager"
    )

    // Build response and set cookie
    const res = NextResponse.json({ sessionId, manager })
    res.cookies.set("session-id", sessionId, {
      path: "/",
      maxAge: 24 * 60 * 60, // 1 day
    })

    return res
  } catch (err) {
    console.error("❌ Error in /api/auth/manager POST:", err)

    const message = err instanceof Error ? err.message : "Invalid request"
    const body: Record<string, any> = { error: message }

    if (process.env.NODE_ENV === "development" && err instanceof Error) {
      body.stack = err.stack
    }

    return NextResponse.json(body, { status: 500 })
  }
}