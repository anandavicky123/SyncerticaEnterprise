import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "anandavicky123";
const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "SyncerticaEnterprise";

export async function POST(request: NextRequest) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 401 },
      );
    }
    // Extract workflow id from the request path. The route is mounted at
    // /api/github/workflows/[id]/run, so the id will be the segment before '/run'.
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // Expected parts: ["api","github","workflows", "<id>", "run"]
    const workflowId = parts[parts.length - 2] || "";
    const body = await request.json().catch(() => ({}));
    const { ref = "main", inputs = {} } = body;

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowId}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "User-Agent": "Syncertica-Enterprise-Dashboard",
        },
        body: JSON.stringify({ ref, inputs }),
      },
    );

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Workflow triggered successfully",
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `Failed to trigger workflow: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status },
      );
    }
  } catch (error) {
    console.error("Error triggering workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
