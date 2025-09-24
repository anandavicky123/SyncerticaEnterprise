import { NextRequest, NextResponse } from "next/server";
import { uninstallGitHubApp } from "@/lib/github-app";
import { getSession } from "@/lib/dynamodb";
import { prisma } from "@/lib/rds-database";

export async function GET(request: NextRequest) {
  // Use absolute URL for redirect
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/dashboard", baseUrl));

  try {
    console.log("🔌 Starting GitHub disconnect process (redirect version)...");

    // Uninstall the GitHub App installations
    const uninstallResult = await uninstallGitHubApp();
    console.log("📱 App uninstall result:", uninstallResult);

    // Also clear stored installation mapping for the current manager session (if any)
    try {
      const sessionId = request.cookies.get("session-id")?.value;
      if (sessionId) {
        const session = await getSession(sessionId);
        if (session && session.actorType === "manager") {
          const managerDelegate: any = (prisma as any).manager;
          await managerDelegate.update({
            where: { deviceUUID: session.actorId },
            data: { githubAppId: null },
          });
          console.log(
            "Cleared github_app fields for manager from disconnect flow",
            session.actorId,
          );
        }
      }
    } catch (err) {
      console.error("Error clearing github fields during disconnect:", err);
    }

    // Remove the actual cookies used by the OAuth flow
    response.cookies.delete("github_access_token");
    response.cookies.delete("github_user");
    // fallback/legacy names
    response.cookies.delete("github_token");
    response.cookies.delete("github_oauth_state");

    // Remove the per-browser disconnect flag since we've actually uninstalled
    response.cookies.delete("github_app_disabled");

    console.log("✅ GitHub disconnect completed (redirect version)");
  } catch (e) {
    console.error("❌ Error clearing GitHub during disconnect:", e);
    // Still clear cookies even if uninstall fails
    response.cookies.delete("github_access_token");
    response.cookies.delete("github_user");
    response.cookies.delete("github_token");
    response.cookies.delete("github_oauth_state");
    response.cookies.delete("github_app_disabled");
  }

  return response;
}
