import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("github_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user repositories
    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repositories = await response.json();

    // Process repositories to include our required information
    const processedRepos = await Promise.all(
      repositories.map(
        async (repo: {
          id: number;
          name: string;
          full_name: string;
          description: string;
          default_branch: string;
          updated_at: string;
          private: boolean;
          html_url: string;
          clone_url: string;
          ssh_url?: string;
          language?: string;
          stargazers_count?: number;
          forks_count?: number;
        }) => {
          const hasWorkflow = await checkForWorkflows(
            repo.full_name,
            accessToken
          );
          const hasTerraform = await checkForTerraform(
            repo.full_name,
            accessToken
          );
          const hasDockerfile = await checkForDockerfile(
            repo.full_name,
            accessToken
          );

          return {
            id: repo.id.toString(),
            name: repo.name,
            full_name: repo.full_name, // Changed from fullName to full_name
            description: repo.description,
            default_branch: repo.default_branch, // Changed from branch
            updated_at: repo.updated_at, // Changed from lastUpdated
            private: repo.private, // Changed from isPrivate
            html_url: repo.html_url, // Changed from url
            clone_url: repo.clone_url, // Changed from cloneUrl
            ssh_url: repo.ssh_url || `git@github.com:${repo.full_name}.git`,
            language: repo.language || "Unknown",
            stargazers_count: repo.stargazers_count || 0,
            forks_count: repo.forks_count || 0,
            // Keep the old properties for backward compatibility
            fullName: repo.full_name,
            branch: repo.default_branch,
            lastUpdated: repo.updated_at,
            status: "Connected",
            source: "GitHub",
            isPrivate: repo.private,
            detectedFiles: {
              workflow: hasWorkflow,
              terraform: hasTerraform,
              dockerfile: hasDockerfile,
            },
            connectionType: "GitHub OAuth",
            url: repo.html_url,
            cloneUrl: repo.clone_url,
          };
        }
      )
    );

    return NextResponse.json({
      repositories: processedRepos,
      total: processedRepos.length,
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}

async function checkForWorkflows(
  repoFullName: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/.github/workflows`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function checkForTerraform(
  repoFullName: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/search/code?q=filename:*.tf+repo:${repoFullName}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    const data = await response.json();
    return data.total_count > 0;
  } catch {
    return false;
  }
}

async function checkForDockerfile(
  repoFullName: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/Dockerfile`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear the authentication cookies
    response.cookies.delete("github_access_token");
    response.cookies.delete("github_user");

    return response;
  } catch (error) {
    console.error("Error disconnecting GitHub:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
