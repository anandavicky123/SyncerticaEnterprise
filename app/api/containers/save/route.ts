import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("github_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "GitHub token not found" },
        { status: 401 },
      );
    }

    const { content, filename, repository, type } = await request.json();

    if (!content || !filename || !repository) {
      return NextResponse.json(
        { error: "Content, filename, and repository are required" },
        { status: 400 },
      );
    }

    // Determine the appropriate file path based on type
    let filePath: string;
    switch (type) {
      case "dockerfile":
        filePath = filename === "Dockerfile" ? "Dockerfile" : filename;
        break;
      case "docker-compose":
        filePath = filename.includes("docker-compose")
          ? filename
          : `docker-compose.yml`;
        break;
      case "kubernetes":
        filePath = `k8s/${filename}`;
        break;
      case "podman":
        filePath = filename === "Containerfile" ? "Containerfile" : filename;
        break;
      default:
        filePath = filename;
    }

    // Check if file already exists
    const checkResponse = await fetch(
      `https://api.github.com/repos/${repository}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "SyncerticaEnterprise",
        },
      },
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
            ? `Update ${type} container: ${filename}`
            : `Add ${type} container: ${filename}`,
          content: Buffer.from(content).toString("base64"),
          sha: sha, // Include SHA if updating existing file
        }),
      },
    );

    if (!createFileResponse.ok) {
      const errorData = await createFileResponse.json();
      console.error("GitHub API error:", errorData);
      return NextResponse.json(
        {
          error: "Failed to save container file to GitHub",
          details: errorData.message,
        },
        { status: createFileResponse.status },
      );
    }

    const result = await createFileResponse.json();

    return NextResponse.json({
      success: true,
      message: sha
        ? "Container file updated successfully"
        : "Container file created successfully",
      file: {
        name: filename,
        path: filePath,
        repository: repository,
        type: type,
        url: result.content.html_url,
      },
    });
  } catch (error) {
    console.error("Error saving container file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
