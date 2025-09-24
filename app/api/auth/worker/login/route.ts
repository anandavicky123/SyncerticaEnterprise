import { NextResponse } from "next/server";
import { authenticateWorker } from "../../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 },
      );
    }

    const { worker, sessionId } = await authenticateWorker(email, password);

    const res = NextResponse.json({ sessionId, worker });
    res.cookies.set("session-id", sessionId, {
      path: "/",
      maxAge: 24 * 60 * 60,
    });
    return res;
  } catch (err: any) {
    console.error("Error in /api/auth/worker/login POST:", err?.message || err);
    const message = err?.message || "Invalid credentials";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
