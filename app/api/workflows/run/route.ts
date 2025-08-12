import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  console.log("🚀 Workflow run API called");

  try {
    const cookieStore = await cookies();
    const githubToken = cookieStore.get("github_access_token")?.value;

    console.log("🔑 GitHub token check:", githubToken ? "Found" : "Not found");

    if (!githubToken) {
      console.log("❌ No GitHub token found in cookies");
      return NextResponse.json(
        { error: "GitHub token not found. Please connect to GitHub first." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { repository, workflow, inputs = {} } = body;

    console.log("📝 Request body:", { repository, workflow, inputs });

    if (!repository || !workflow) {
      console.log("❌ Missing repository or workflow parameter");
      return NextResponse.json(
        { error: "Repository and workflow parameters are required" },
        { status: 400 }
      );
    }

    // Get workflow ID first
    console.log("🔍 Fetching workflows for repository:", repository);
    const workflowsResponse = await fetch(
      `https://api.github.com/repos/${repository}/actions/workflows`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    console.log("📡 Workflows API response status:", workflowsResponse.status);

    if (!workflowsResponse.ok) {
      console.log(
        "❌ Failed to fetch workflows:",
        workflowsResponse.statusText
      );
      throw new Error(
        `Failed to fetch workflows: ${workflowsResponse.statusText}`
      );
    }

    const workflowsData = await workflowsResponse.json();
    console.log(
      "📋 Available workflows:",
      workflowsData.workflows?.map((w: any) => ({
        name: w.name,
        path: w.path,
        id: w.id,
      }))
    );

    const targetWorkflow = workflowsData.workflows?.find(
      (w: any) => w.path.includes(workflow) || w.name === workflow
    );

    console.log(
      "🎯 Target workflow:",
      targetWorkflow ? `Found: ${targetWorkflow.name}` : "Not found"
    );

    if (!targetWorkflow) {
      console.log(
        "❌ Workflow not found. Available workflows:",
        workflowsData.workflows?.map((w: any) => w.name)
      );
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Trigger workflow dispatch
    console.log("🚀 Triggering workflow dispatch for:", targetWorkflow.name);
    const dispatchResponse = await fetch(
      `https://api.github.com/repos/${repository}/actions/workflows/${targetWorkflow.id}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main", // Default to main branch, could be made configurable
          inputs: inputs,
        }),
      }
    );

    console.log("📡 Dispatch response status:", dispatchResponse.status);

    if (!dispatchResponse.ok) {
      const errorText = await dispatchResponse.text();
      console.log("❌ Dispatch failed:", errorText);
      throw new Error(
        `Failed to trigger workflow: ${dispatchResponse.statusText} - ${errorText}`
      );
    }

    // GitHub API returns 204 No Content on successful dispatch
    if (dispatchResponse.status === 204) {
      console.log("✅ Workflow triggered successfully");
      return NextResponse.json({
        success: true,
        message: "Workflow triggered successfully",
        workflow: {
          id: targetWorkflow.id,
          name: targetWorkflow.name,
          path: targetWorkflow.path,
        },
      });
    }

    console.log("✅ Workflow trigger request sent");
    return NextResponse.json({
      success: true,
      message: "Workflow trigger request sent",
    });
  } catch (error) {
    console.error("❌ Error running workflow:", error);
    return NextResponse.json(
      {
        error: "Failed to run workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
