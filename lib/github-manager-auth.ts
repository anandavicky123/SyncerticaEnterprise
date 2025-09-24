import { cookies } from "next/headers";
import { getSession } from "@/lib/dynamodb";
import { prisma } from "@/lib/rds-database";
import { getInstallationToken } from "@/lib/github-app";

/**
 * Get the current manager's GitHub App installation ID and token
 * Returns null if no session, not a manager, or no installation ID stored
 */
export async function getCurrentManagerInstallation(): Promise<{
  installationId: string;
  installationToken: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session-id")?.value;

    if (!sessionId) {
      console.log("No session ID found");
      return null;
    }

    const session = await getSession(sessionId);
    if (!session || session.actorType !== "manager") {
      console.log("No valid manager session found");
      return null;
    }

    const manager = await prisma.manager.findUnique({
      where: { deviceUUID: session.actorId },
      select: { githubAppId: true },
    });

    if (!manager || !manager.githubAppId) {
      console.log(
        `No GitHub App installation ID found for manager ${session.actorId}`,
      );
      return null;
    }

    // Get installation token for this specific installation
    const installationToken = await getInstallationToken(
      parseInt(manager.githubAppId),
    );

    console.log(
      `Using installation ID ${manager.githubAppId} for manager ${session.actorId}`,
    );

    return {
      installationId: manager.githubAppId,
      installationToken: installationToken.token,
    };
  } catch (error) {
    console.error("Error getting manager installation:", error);
    return null;
  }
}

/**
 * Get auth headers for GitHub API using the current manager's installation
 */
export async function getManagerGitHubAuthHeaders(): Promise<{
  Authorization: string;
  Accept: string;
  "X-GitHub-Api-Version": string;
} | null> {
  const installation = await getCurrentManagerInstallation();

  if (!installation) {
    return null;
  }

  return {
    Authorization: `token ${installation.installationToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}
