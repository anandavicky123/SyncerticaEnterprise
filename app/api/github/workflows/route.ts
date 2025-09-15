import { NextRequest, NextResponse } from "next/server";
import { triggerWorkflowWithApp } from "@/lib/github-app";

// If critical env vars are not available (for example when you prefer using
// `.env` instead of Next's `.env.local`), try loading `.env` explicitly so
// server-side API routes pick up values without requiring `.env.local`.
if (!process.env.GITHUB_TOKEN && !process.env.GITHUB_APP_ID) {
  (async () => {
    try {
      const dotenv = await import("dotenv");
      const path = await import("path");
      const fs = await import("fs");
      const envPath = path.resolve(process.cwd(), ".env");
      if ((fs as any).existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log("Loaded environment variables from .env");
      }
    } catch (e) {
      // ignore - if dotenv is not available or fails, process.env remains unchanged
      console.log(
        "Could not load .env via dotenv:",
        e && (e as Error).message ? (e as Error).message : String(e)
      );
    }
  })();
}

// GitHub App configuration takes priority over PAT
const GITHUB_APP_ID = process.env.GITHUB_APP_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "anandavicky123";
const GITHUB_REPO =
  process.env.NEXT_PUBLIC_GITHUB_REPO || "SyncerticaEnterprise";

if (!GITHUB_APP_ID && !GITHUB_TOKEN) {
  console.warn("Neither GITHUB_APP_ID nor GITHUB_TOKEN is set in environment variables");
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
    console.log("GitHub workflows POST handler called");

    const { searchParams } = new URL(request.url);
    let action = searchParams.get("action");

    // If action is not in query params, check request body
    if (!action) {
      const body = await request.json();
      action = body.action;

      if (action === "trigger") {
        const {
          workflowId,
          ref = "main",
          inputs = {},
          repository,
          filename,
        } = body;

        console.log("Triggering workflow (body):", {
          workflowId,
          ref,
          inputs,
          repository,
          filename,
        });

        if (!workflowId && !filename) {
          return NextResponse.json(
            { error: "workflowId or filename is required" },
            { status: 400 }
          );
        }

        // Prefer repository from request body, fallback to env
        const targetRepo = repository || `${GITHUB_OWNER}/${GITHUB_REPO}`;

        // If repository is full "owner/repo", use it; otherwise assume owner/repo
        const repoParts = targetRepo.split("/");
        let owner = GITHUB_OWNER;
        let repo = GITHUB_REPO;
        if (repoParts.length === 2) {
          owner = repoParts[0];
          repo = repoParts[1];
        }

        // Use GitHub App authentication if available, otherwise fall back to PAT
        if (GITHUB_APP_ID) {
          console.log("Using GitHub App authentication");
          
          // Try with workflowId first
          if (workflowId) {
            const result = await triggerWorkflowWithApp(owner, repo, workflowId, ref, inputs);
            
            if (result.success) {
              return NextResponse.json({ success: true, message: result.message });
            }
            
            // If failed and we have a filename, try with filename
            if (filename) {
              const fileIdentifier = filename.endsWith(".yml") || filename.endsWith(".yaml")
                ? filename
                : `${filename}.yml`;
              
              const filenameResult = await triggerWorkflowWithApp(owner, repo, fileIdentifier, ref, inputs);
              
              if (filenameResult.success) {
                return NextResponse.json({ success: true, message: filenameResult.message });
              }
              
              return NextResponse.json(
                { 
                  error: filenameResult.message,
                  details: filenameResult.data 
                },
                { status: 400 }
              );
            }
            
            return NextResponse.json(
              { 
                error: result.message,
                details: result.data 
              },
              { status: 400 }
            );
          }
          
          // Try with filename only
          if (filename) {
            const fileIdentifier = filename.endsWith(".yml") || filename.endsWith(".yaml")
              ? filename
              : `${filename}.yml`;
            
            const result = await triggerWorkflowWithApp(owner, repo, fileIdentifier, ref, inputs);
            
            if (result.success) {
              return NextResponse.json({ success: true, message: result.message });
            }
            
            return NextResponse.json(
              { 
                error: result.message,
                details: result.data 
              },
              { status: 400 }
            );
          }
        } else if (GITHUB_TOKEN) {
          console.log("Using Personal Access Token authentication");
          
          // Legacy PAT-based authentication (fallback)
          // Try using the provided workflowId (which may be numeric) first
          if (workflowId) {
            const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;
            console.log("Making request to:", githubApiUrl);

            const response = await fetch(githubApiUrl, {
              method: "POST",
              headers: {
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                "User-Agent": "Syncertica-Enterprise-Dashboard",
              },
              body: JSON.stringify({ ref, inputs }),
            });

            console.log("GitHub API response status:", response.status);

            if (response.ok) {
              return NextResponse.json({ success: true });
            }

            // If not found (404), we'll try to fall back to filename below
            const errorText = await response.text();
            console.log("GitHub API error for numeric id:", errorText);
            if (response.status !== 404) {
              return NextResponse.json(
                {
                  error: `Failed to trigger workflow: ${response.status} ${response.statusText}`,
                  details: errorText,
                },
                { status: response.status }
              );
            }
          }

          // If we reach here, either no workflowId or numeric id 404'd - try filename if available
          if (filename) {
            // filename may be like 'hello.yml' or 'hello'
            const fileIdentifier =
              filename.endsWith(".yml") || filename.endsWith(".yaml")
                ? filename
                : `${filename}.yml`;
            const githubApiUrl2 = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${fileIdentifier}/dispatches`;
            console.log("Retrying with filename at:", githubApiUrl2);

            const response2 = await fetch(githubApiUrl2, {
              method: "POST",
              headers: {
                Accept: "application/vnd.github.v3+json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                "User-Agent": "Syncertica-Enterprise-Dashboard",
              },
              body: JSON.stringify({ ref, inputs }),
            });

            console.log(
              "GitHub API response status (filename attempt):",
              response2.status
            );
            if (response2.ok) {
              return NextResponse.json({ success: true });
            }

            const errorText2 = await response2.text();
            console.log("GitHub API error (filename attempt):", errorText2);
            return NextResponse.json(
              {
                error: `Failed to trigger workflow: ${response2.status} ${response2.statusText}`,
                details: errorText2,
              },
              { status: response2.status }
            );
          }
        } else {
          return NextResponse.json(
            { 
              error: "No authentication configured. Please set up either GITHUB_APP_ID (recommended) or GITHUB_TOKEN in your environment variables." 
            },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { error: "Workflow not found" },
          { status: 404 }
        );
      }
    }

    // Handle original query parameter approach for backward compatibility
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
