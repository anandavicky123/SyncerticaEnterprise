import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "anandavicky123";
const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "SyncerticaEnterprise";

if (!GITHUB_TOKEN) {
  console.warn("GITHUB_TOKEN is not set in environment variables");
}

async function githubRequest(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Syncertica-Enterprise-Dashboard",
    ...(options.headers as Record<string, string>),
  };

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 403) {
      const remaining = response.headers.get("X-RateLimit-Remaining");
      const resetTime = response.headers.get("X-RateLimit-Reset");
      throw new Error(
        `GitHub API rate limit exceeded. Remaining: ${remaining}, Reset: ${resetTime}`
      );
    }
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "workflows": {
        const data = await githubRequest(
          `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows`
        );
        return NextResponse.json(data);
      }

      case "runs": {
        const workflowId = searchParams.get("workflowId");
        const limit = searchParams.get("limit") || "10";

        const endpoint = workflowId
          ? `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowId}/runs?per_page=${limit}`
          : `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?per_page=${limit}`;

        const data = await githubRequest(endpoint);
        return NextResponse.json(data);
      }

      case "jobs": {
        const runId = searchParams.get("runId");
        if (!runId) {
          return NextResponse.json(
            { error: "runId is required" },
            { status: 400 }
          );
        }

        const data = await githubRequest(
          `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}/jobs`
        );
        return NextResponse.json(data);
      }

      case "repository": {
        const data = await githubRequest(
          `/repos/${GITHUB_OWNER}/${GITHUB_REPO}`
        );
        return NextResponse.json(data);
      }

      case "status": {
        // Return API status and rate limit info
        const response = await fetch("https://api.github.com/rate_limit", {
          headers: {
            Authorization: GITHUB_TOKEN ? `Bearer ${GITHUB_TOKEN}` : "",
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (response.ok) {
          const rateLimit = await response.json();
          return NextResponse.json({
            authenticated: !!GITHUB_TOKEN,
            rateLimit: rateLimit.rate,
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
          });
        } else {
          return NextResponse.json({
            authenticated: !!GITHUB_TOKEN,
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            error: "Failed to fetch rate limit",
          });
        }
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("GitHub API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "trigger") {
      const body = await request.json();
      const { workflowId, ref = "main", inputs = {} } = body;

      if (!workflowId) {
        return NextResponse.json(
          { error: "workflowId is required" },
          { status: 400 }
        );
      }

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${workflowId}/dispatches`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
            Authorization: GITHUB_TOKEN ? `Bearer ${GITHUB_TOKEN}` : "",
            "User-Agent": "Syncertica-Enterprise-Dashboard",
          },
          body: JSON.stringify({ ref, inputs }),
        }
      );

      if (response.ok) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json(
          { error: `Failed to trigger workflow: ${response.statusText}` },
          { status: response.status }
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("GitHub API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
