import { NextRequest, NextResponse } from "next/server";

/**
 * Minimal GET handler for /api/github/repos
 * Returns a simple status payload. This file existed but was empty which
 * caused the Next.js type checker to fail complaining the file is not a module.
 * Keeping this minimal implementation so builds succeed; we can add full
 * repository listing logic (using GitHub App credentials) later if needed.
 */
export async function GET(request: NextRequest) {
	try {
		// Optionally accept query params like installationId
		const url = new URL(request.url);
		const installationId = url.searchParams.get("installationId") || null;

		return NextResponse.json({
			status: "ok",
			endpoint: "/api/github/repos",
			installationId,
			message:
				"This is a placeholder GET handler for GitHub repos. Implement repo syncing as needed.",
		});
	} catch (error) {
		console.error("GET /api/github/repos error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

// Keep the module extensible: export a simple POST handler if callers expect it
export async function POST(request: NextRequest) {
	try {
		const body = await request.json().catch(() => ({}));
		return NextResponse.json({ status: "ok", received: body });
	} catch (error) {
		console.error("POST /api/github/repos error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
