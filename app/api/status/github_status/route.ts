import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInstallations, uninstallGitHubApp } from "@/lib/github-app";

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
        // Get the first installation's account info
        const firstInstallation = installations[0];
        return NextResponse.json({
          connected: true,
          method: "app",
          user: {
            id: firstInstallation.account.id,
            login: firstInstallation.account.login,
            name: firstInstallation.account.login,
            avatar_url: `https://github.com/${firstInstallation.account.login}.png`,
          },
          installation: {
            id: firstInstallation.id,
            account: firstInstallation.account,
            repository_selection: firstInstallation.repository_selection,
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
