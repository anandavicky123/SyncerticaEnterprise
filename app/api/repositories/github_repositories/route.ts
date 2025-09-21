import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInstallations, getInstallationToken } from "@/lib/github-app";
import { getSession } from "@/lib/dynamodb";
import { prisma } from "@/lib/rds-database";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("github_access_token")?.value;

    let repositories = [];

    // Try OAuth first (legacy support)
    if (accessToken) {
      try {
        const response = await fetch(
          "https://api.github.com/user/repos?per_page=100&sort=updated",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (response.ok) {
          repositories = await response.json();
        }
      } catch (error) {
        console.error("OAuth repository fetch failed:", error);
      }
    }

    // If OAuth failed or no repositories, try GitHub App
    if (repositories.length === 0) {
      try {
        // Get current manager's installation ID
        const sessionId = cookieStore.get("session-id")?.value;
        let managerInstallationId = null;

        if (sessionId) {
          const session = await getSession(sessionId);
          if (session && session.actorType === "manager") {
            const manager = await prisma.manager.findUnique({
              where: { deviceUUID: session.actorId },
              select: { githubAppId: true },
            });

            if (manager && manager.githubAppId) {
              managerInstallationId = manager.githubAppId;
              console.log(
                `Using manager-specific installation ID: ${managerInstallationId}`
              );
            }
          }
        }

        if (!managerInstallationId) {
          console.log("No installation ID found for current manager");
          return NextResponse.json(
            { error: "No GitHub App installation found for this manager" },
            { status: 401 }
          );
        }

        // Only fetch repositories for this manager's specific installation
        try {
          // Get installation token for the manager's specific installation
          const installationToken = await getInstallationToken(
            parseInt(managerInstallationId)
          );

          // Fetch repositories for this specific installation only
          const response = await fetch(
            `https://api.github.com/installation/repositories?per_page=100`,
            {
              headers: {
                Authorization: `token ${installationToken.token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            repositories = data.repositories || [];
            console.log(
              `Fetched ${repositories.length} repositories for installation ${managerInstallationId}`
            );
          } else {
            console.error(
              `Failed to fetch repos for installation ${managerInstallationId}:`,
              response.status
            );
          }
        } catch (error) {
          console.error(
            `Failed to fetch repos for installation ${managerInstallationId}:`,
            error
          );
        }
      } catch (error) {
        console.error("GitHub App repository fetch failed:", error);
        return NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        );
      }
    }

    if (repositories.length === 0) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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
            accessToken || null
          );
          const hasTerraform = await checkForTerraform(
            repo.full_name,
            accessToken || null
          );
          const hasDockerfile = await checkForDockerfile(
            repo.full_name,
            accessToken || null
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
            connectionType: accessToken ? "GitHub OAuth" : "GitHub App",
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
  accessToken: string | null
): Promise<boolean> {
  try {
    let response;

    if (accessToken) {
      // Try OAuth first
      response = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/.github/workflows`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
    }

    if (!response || !response.ok) {
      // Try GitHub App
      try {
        const installations = await getInstallations();
        for (const installation of installations) {
          const installationToken = await getInstallationToken(installation.id);
          response = await fetch(
            `https://api.github.com/repos/${repoFullName}/contents/.github/workflows`,
            {
              headers: {
                Authorization: `token ${installationToken.token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            }
          );
          if (response.ok) break;
        }
      } catch (error) {
        console.error("GitHub App workflow check failed:", error);
      }
    }

    return response?.ok || false;
  } catch {
    return false;
  }
}

async function checkForTerraform(
  repoFullName: string,
  accessToken: string | null
): Promise<boolean> {
  try {
    let response;

    if (accessToken) {
      // Try OAuth first
      response = await fetch(
        `https://api.github.com/search/code?q=filename:*.tf+repo:${repoFullName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
    }

    if (!response || !response.ok) {
      // Try GitHub App
      try {
        const installations = await getInstallations();
        for (const installation of installations) {
          const installationToken = await getInstallationToken(installation.id);
          response = await fetch(
            `https://api.github.com/search/code?q=filename:*.tf+repo:${repoFullName}`,
            {
              headers: {
                Authorization: `token ${installationToken.token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            }
          );
          if (response.ok) break;
        }
      } catch (error) {
        console.error("GitHub App terraform check failed:", error);
      }
    }

    if (response?.ok) {
      const data = await response.json();
      return data.total_count > 0;
    }
    return false;
  } catch {
    return false;
  }
}

async function checkForDockerfile(
  repoFullName: string,
  accessToken: string | null
): Promise<boolean> {
  try {
    let response;

    if (accessToken) {
      // Try OAuth first
      response = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/Dockerfile`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
    }

    if (!response || !response.ok) {
      // Try GitHub App
      try {
        const installations = await getInstallations();
        for (const installation of installations) {
          const installationToken = await getInstallationToken(installation.id);
          response = await fetch(
            `https://api.github.com/repos/${repoFullName}/contents/Dockerfile`,
            {
              headers: {
                Authorization: `token ${installationToken.token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
              },
            }
          );
          if (response.ok) break;
        }
      } catch (error) {
        console.error("GitHub App dockerfile check failed:", error);
      }
    }

    return response?.ok || false;
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
