import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getManagerGitHubAuthHeaders,
  getCurrentManagerInstallation,
} from "@/lib/github-manager-auth";
import { getSession } from "@/lib/dynamodb";

// Manager-specific cache to avoid hitting GitHub API too frequently
// Key: `${managerDeviceUUID}-${repo}`, Value: cache data
const workflowCacheByManager: Map<
  string,
  {
    data: any[];
    timestamp: number;
  }
> = new Map();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Get the current session and manager first
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session-id")?.value;

    if (!sessionId) {
      console.log("❌ No session ID found");
      return NextResponse.json(
        { error: "Not authenticated", workflows: [] },
        { status: 401 },
      );
    }

    const session = await getSession(sessionId);
    if (!session || session.actorType !== "manager") {
      console.log("❌ No valid manager session found");
      return NextResponse.json(
        { error: "Not authenticated as manager", workflows: [] },
        { status: 401 },
      );
    }

    const managerDeviceUUID = session.actorId;
    console.log(`✅ Authenticated as manager: ${managerDeviceUUID}`);

    // Verify manager's GitHub App installation
    const installation = await getCurrentManagerInstallation();
    if (!installation) {
      console.log("❌ No GitHub App installation found for manager");
      return NextResponse.json(
        { error: "GitHub App not installed for this manager", workflows: [] },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");
    const force = searchParams.get("force") === "true"; // Support force refresh

    const accessToken = cookieStore.get("github_access_token")?.value;

    // Try OAuth first, then GitHub App
    let authHeaders = null;
    if (accessToken) {
      authHeaders = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      };
      console.log("🔑 Using OAuth token for authentication");
    } else {
      // Use manager-specific GitHub App authentication
      authHeaders = await getManagerGitHubAuthHeaders();
      console.log("🔑 Using GitHub App installation token for authentication");
    }

    if (!authHeaders) {
      return NextResponse.json(
        { error: "Not authenticated", workflows: [] },
        { status: 401 },
      );
    }

    console.log("🔍 Workflows API called for repo:", repo);

    // If no specific repo, get workflows from all repos (manager-specific)
    if (!repo) {
      return await getAllWorkflows(authHeaders, managerDeviceUUID);
    }

    // Check manager-specific cache first (skip if force refresh requested)
    const cacheKey = `${managerDeviceUUID}-${repo}`;
    const cachedData = workflowCacheByManager.get(cacheKey);
    if (
      !force &&
      cachedData &&
      Date.now() - cachedData.timestamp < CACHE_DURATION
    ) {
      console.log("⚙️ Returning cached workflow data for", repo);
      return NextResponse.json({
        workflows: cachedData.data,
        total: cachedData.data.length,
        cached: true,
      });
    }

    if (force) {
      console.log("🔄 Force refresh requested, bypassing cache for", repo);
    }

    console.log("⚙️ Fetching workflow files for:", repo);

    // Get workflow files from .github/workflows directory
    const workflowDirResponse = await fetch(
      `https://api.github.com/repos/${repo}/contents/.github/workflows`,
      {
        headers: {
          ...authHeaders,
          "User-Agent": "SyncerticaEnterprise",
        },
      },
    );

    let workflowFiles: any[] = [];

    if (workflowDirResponse.ok) {
      const dirContents = await workflowDirResponse.json();
      workflowFiles = Array.isArray(dirContents)
        ? dirContents.filter(
            (file: any) =>
              file.type === "file" &&
              (file.name.endsWith(".yml") || file.name.endsWith(".yaml")),
          )
        : [];

      console.log(`⚙️ Found ${workflowFiles.length} workflow files in ${repo}`);
    } else {
      console.log(`⚙️ No .github/workflows directory found in ${repo}`);
    }

    // Also check for workflows in the repository using the Actions API
    let workflowRuns: any[] = [];
    try {
      const actionsResponse = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows`,
        {
          headers: {
            ...authHeaders,
            "User-Agent": "SyncerticaEnterprise",
          },
        },
      );

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        workflowRuns = actionsData.workflows || [];
        console.log(
          `⚙️ Found ${workflowRuns.length} workflow definitions via Actions API`,
        );
      }
    } catch {
      console.log(
        "⚠️ Could not fetch workflow runs (repo might not have Actions enabled)",
      );
    }

    // Transform workflow files to our format
    const transformedWorkflows = workflowFiles.map((file: any) => {
      // Try to find matching workflow run data
      const matchingRun = workflowRuns.find(
        (run: any) => run.path === `.github/workflows/${file.name}`,
      );

      return {
        id: `${repo}-${file.sha}`,
        name: file.name.replace(/\.(yml|yaml)$/, ""),
        filename: file.name,
        path: `.github/workflows/${file.name}`,
        state: matchingRun?.state || "active",
        status: matchingRun?.status || "unknown",
        conclusion: matchingRun?.conclusion || "none",
        html_url: file.html_url,
        repository: repo,
        updated_at: file.updated_at || new Date().toISOString(),
        download_url: file.download_url,
        size: file.size,
        workflow_id: matchingRun?.id,
        badge_url: matchingRun?.badge_url,
      };
    });

    // Add workflow runs that might not have files (deleted workflows, etc.)
    const additionalWorkflows = workflowRuns
      .filter(
        (run: any) =>
          !workflowFiles.some(
            (file: any) => run.path === `.github/workflows/${file.name}`,
          ),
      )
      .map((run: any) => ({
        id: `${repo}-workflow-${run.id}`,
        name: run.name,
        filename: run.path.split("/").pop() || run.name,
        path: run.path,
        state: run.state,
        status: "unknown",
        conclusion: "none",
        html_url: run.html_url,
        repository: repo,
        updated_at: run.updated_at,
        workflow_id: run.id,
        badge_url: run.badge_url,
      }));

    const allWorkflows = [...transformedWorkflows, ...additionalWorkflows];

    // Cache the results with manager-specific key
    workflowCacheByManager.set(cacheKey, {
      data: transformedWorkflows,
      timestamp: Date.now(),
    });
    console.log(
      `✅ Workflow fetch complete. Found ${allWorkflows.length} workflows for ${repo}`,
    );

    return NextResponse.json({
      workflows: allWorkflows,
      total: allWorkflows.length,
    });
  } catch (error) {
    console.error("❌ Error fetching workflows:", error);

    // If we have cached data, return it on error
    const cacheKey = request.nextUrl.searchParams.get("repo") || "all";
    const cachedData = workflowCacheByManager.get(cacheKey);
    if (cachedData) {
      console.log("🔄 API error, returning cached workflow data");
      return NextResponse.json({
        workflows: cachedData.data,
        total: cachedData.data.length,
        cached: true,
        error: "API temporarily unavailable, showing cached data",
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch workflows", workflows: [] },
      { status: 500 },
    );
  }
}

async function getAllWorkflows(authHeaders: any, managerDeviceUUID: string) {
  try {
    console.log(
      `⚙️ Fetching workflows from manager-specific repositories for: ${managerDeviceUUID}`,
    );

    // Get repositories for this manager's installation only
    const reposResponse = await fetch(
      "https://api.github.com/installation/repositories?per_page=100",
      {
        headers: {
          ...authHeaders,
          "User-Agent": "SyncerticaEnterprise",
        },
      },
    );

    if (!reposResponse.ok) {
      throw new Error(`Failed to fetch repositories: ${reposResponse.status}`);
    }

    const reposData = await reposResponse.json();
    const repositories = reposData.repositories || [];
    console.log(`✅ Found ${repositories.length} installation repositories`);

    const allWorkflows: any[] = [];

    // Search for workflows in each repository
    for (const repo of repositories.slice(0, 10)) {
      // Limit to first 10 repos to avoid rate limiting
      try {
        // Get workflow files from .github/workflows directory
        const workflowDirResponse = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/.github/workflows`,
          {
            headers: {
              ...authHeaders,
              "User-Agent": "SyncerticaEnterprise",
            },
          },
        );

        if (workflowDirResponse.ok) {
          const dirContents = await workflowDirResponse.json();
          const workflowFiles = Array.isArray(dirContents)
            ? dirContents.filter(
                (file: any) =>
                  file.type === "file" &&
                  (file.name.endsWith(".yml") || file.name.endsWith(".yaml")),
              )
            : [];

          const transformedWorkflows = workflowFiles.map((file: any) => ({
            id: `${repo.full_name}-${file.sha}`,
            name: file.name.replace(/\.(yml|yaml)$/, ""),
            filename: file.name,
            path: `.github/workflows/${file.name}`,
            state: "active",
            status: "unknown",
            conclusion: "none",
            html_url: file.html_url,
            repository: repo.full_name,
            updated_at: file.updated_at || new Date().toISOString(),
            download_url: file.download_url,
            size: file.size,
          }));

          allWorkflows.push(...transformedWorkflows);
          console.log(
            `⚙️ Found ${transformedWorkflows.length} workflows in ${repo.full_name}`,
          );
        }
      } catch (error) {
        console.error(
          `❌ Error checking workflows in ${repo.full_name}:`,
          error,
        );
        continue;
      }
    }

    console.log(
      `✅ Workflow search complete. Found ${allWorkflows.length} total workflows`,
    );

    return NextResponse.json({
      workflows: allWorkflows,
      total: allWorkflows.length,
    });
  } catch (error) {
    console.error("❌ Error fetching all workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows", workflows: [] },
      { status: 500 },
    );
  }
}
