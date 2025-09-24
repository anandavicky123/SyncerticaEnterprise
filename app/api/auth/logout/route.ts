import { NextResponse } from "next/server";
import { deleteSession } from "../../../../lib/dynamodb";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|; )session-id=([^;]+)/);
    const sessionId = match ? decodeURIComponent(match[1]) : undefined;

    if (sessionId) {
      try {
        await deleteSession(sessionId);
      } catch (e) {
        console.error("/api/auth/logout - deleteSession error:", e);
      }
    }

    const res = NextResponse.json({ success: true });
    // Clear cookie
    res.cookies.set("session-id", "", { path: "/", expires: new Date(0) });
    return res;
  } catch (err) {
    console.error("/api/auth/logout - error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 },
    );
  }
}
