import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/dynamodb";

// Force Node.js runtime for AWS SDK compatibility
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|; )session-id=([^;]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : undefined;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, isLoggedIn: false },
        { status: 401 },
      );
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, isLoggedIn: false },
        { status: 401 },
      );
    }

    // Return shape expected by client code: include isLoggedIn flag
    return NextResponse.json({ success: true, isLoggedIn: true, session });
  } catch (err) {
    console.error("/api/auth/session - error:", err);
    return NextResponse.json(
      { success: false, isLoggedIn: false, error: String(err) },
      { status: 500 },
    );
  }
}
