import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInstallations, uninstallGitHubApp } from "@/lib/github-app";
import { getSession } from '@/lib/dynamodb';
import { prisma } from '@/lib/rds-database';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("github_access_token")?.value;

    // First check OAuth connection (legacy)
    if (accessToken) {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return NextResponse.json({
          connected: true,
          method: "oauth",
          user: {
            id: userData.id,
            login: userData.login,
            name: userData.name,
            avatar_url: userData.avatar_url,
          },
        });
      }
    }

    // Check GitHub App installation
    try {
      const installations = await getInstallations();

      if (installations && installations.length > 0) {
        // Check current manager's session
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session-id')?.value;
        let currentManagerId = null;
        let currentManager = null;

        if (sessionId) {
          const session = await getSession(sessionId);
          if (session && session.actorType === 'manager') {
            currentManagerId = session.actorId;
            currentManager = await prisma.manager.findUnique({
              where: { deviceUUID: currentManagerId },
              select: { githubAppId: true }
            });
          }
        }

        // Find an installation that this manager can use
        let availableInstallation = null;
        let alreadyOwnedInstallation = null;

        for (const installation of installations) {
          const installationId = String(installation.id);
          
          // Check if this installation is already claimed by any manager
          const existingManager = await prisma.manager.findFirst({
            where: { githubAppId: installationId },
            select: { deviceUUID: true, githubAppId: true }
          });

          if (existingManager) {
            if (existingManager.deviceUUID === currentManagerId) {
              // This manager already owns this installation
              alreadyOwnedInstallation = installation;
              break;
            }
            // Installation is claimed by another manager - skip it
            continue;
          } else {
            // Installation is not claimed by anyone
            if (!availableInstallation) {
              availableInstallation = installation;
            }
          }
        }

        // Determine which installation to use
        let installationToUse = alreadyOwnedInstallation || availableInstallation;

        if (!installationToUse) {
          // No available installations - all are claimed by other managers
          return NextResponse.json({
            connected: false,
            error: "All GitHub App installations are already claimed by other managers"
          });
        }

        // Auto-persist installation ID if current manager doesn't have one and installation is available
        if (currentManager && !currentManager.githubAppId && availableInstallation && !alreadyOwnedInstallation && currentManagerId) {
          try {
            await prisma.manager.update({
              where: { deviceUUID: currentManagerId },
              data: { githubAppId: String(availableInstallation.id) }
            });
            console.log(`Auto-persisted installation ID ${availableInstallation.id} for manager ${currentManagerId}`);
            installationToUse = availableInstallation;
          } catch (persistError) {
            console.error('Error auto-persisting installation ID:', persistError);
            // If persistence fails, still return the available installation info
          }
        }

        return NextResponse.json({
          connected: true,
          method: "app",
          user: {
            id: installationToUse.account.id,
            login: installationToUse.account.login,
            name: installationToUse.account.login,
            avatar_url: `https://github.com/${installationToUse.account.login}.png`,
          },
          installation: {
            id: installationToUse.id,
            account: installationToUse.account,
            repository_selection: installationToUse.repository_selection,
          },
        });
      }
    } catch (error) {
      console.error("GitHub App check failed:", error);
    }

    // Neither OAuth nor GitHub App is connected
    return NextResponse.json({ connected: false });
  } catch (error) {
    console.error("GitHub status check error:", error);
    return NextResponse.json({ connected: false });
  }
}

export async function DELETE() {
  try {
    console.log("🔌 Starting GitHub disconnect process...");

    // First, try to uninstall the GitHub App installations
    const uninstallResult = await uninstallGitHubApp();
    console.log("📱 App uninstall result:", uninstallResult);

    const response = NextResponse.json({
      success: true,
      uninstalled: uninstallResult.success,
      message: uninstallResult.message,
      uninstalledCount: uninstallResult.uninstalledCount,
    });

    // Remove OAuth tokens (if any)
    response.cookies.delete("github_access_token");
    response.cookies.delete("github_user");

    // Clear manager mapping in RDS for the current session (best-effort)
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get('session-id')?.value;
      if (sessionId) {
        const session = await getSession(sessionId);
        if (session && session.actorType === 'manager') {
          const managerDelegate: any = (prisma as any).manager;
          await managerDelegate.update({
            where: { deviceUUID: session.actorId },
            data: { githubAppId: null },
          });
          console.log('Cleared github_app fields for manager from status DELETE', session.actorId);
        }
      }
    } catch (err) {
      console.error('Error clearing github fields during status DELETE disconnect:', err);
    }

    // Remove the per-browser disconnect flag since we've actually uninstalled
    // No need to set github_app_disabled anymore since the app is truly gone
    response.cookies.delete("github_app_disabled");

    console.log("✅ GitHub disconnect completed");
    return response;
  } catch (error) {
    console.error("❌ Error disconnecting GitHub:", error);

    // Even if uninstall fails, still clear local tokens/cookies
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        uninstalled: false,
      },
      { status: 500 }
    );

    response.cookies.delete("github_access_token");
    response.cookies.delete("github_user");
    response.cookies.delete("github_app_disabled");

    return response;
  }
}
