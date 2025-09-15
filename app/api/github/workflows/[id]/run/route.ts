import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "anandavicky123";
const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "SyncerticaEnterprise";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 401 }
      );
    }

    const workflowId = params.id;
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
      }
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
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Error triggering workflow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
