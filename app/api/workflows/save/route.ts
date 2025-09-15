import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("github_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "GitHub token not found" },
        { status: 401 }
      );
    }

    const { content, filename, repository } = await request.json();

    if (!content || !filename || !repository) {
      return NextResponse.json(
        { error: "Content, filename, and repository are required" },
        { status: 400 }
      );
    }

    // Ensure the filename has .yml or .yaml extension
    const workflowFilename =
      filename.endsWith(".yml") || filename.endsWith(".yaml")
        ? filename
        : `${filename}.yml`;

    // Create the file path for GitHub Actions workflows
    const filePath = `.github/workflows/${workflowFilename}`;

    // Check if file already exists
    const checkResponse = await fetch(
      `https://api.github.com/repos/${repository}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SyncerticaEnterprise",
        },
      }
    );

    let sha: string | undefined;
    if (checkResponse.ok) {
      const existingFile = await checkResponse.json();
      sha = existingFile.sha;
    }

    // Create or update the file
    const createFileResponse = await fetch(
      `https://api.github.com/repos/${repository}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SyncerticaEnterprise",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: sha
            ? `Update workflow: ${workflowFilename}`
            : `Add workflow: ${workflowFilename}`,
          content: Buffer.from(content).toString("base64"),
          sha: sha, // Include SHA if updating existing file
        }),
      }
    );

    if (!createFileResponse.ok) {
      const errorData = await createFileResponse.json();
      console.error("GitHub API error:", errorData);
      return NextResponse.json(
        {
          error: "Failed to save workflow to GitHub",
          details: errorData.message,
        },
        { status: createFileResponse.status }
      );
    }

    const result = await createFileResponse.json();

    return NextResponse.json({
      success: true,
      message: sha
        ? "Workflow updated successfully"
        : "Workflow created successfully",
      file: {
        name: workflowFilename,
        path: filePath,
        repository: repository,
        url: result.content.html_url,
      },
    });
  } catch (error) {
    console.error("Error saving workflow:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
