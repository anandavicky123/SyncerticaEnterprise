import { NextResponse } from "next/server";
import { uninstallGitHubApp } from "@/lib/github-app";

export async function GET() {
  // Use absolute URL for redirect
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/dashboard", baseUrl));

  try {
    console.log("🔌 Starting GitHub disconnect process (redirect version)...");

    // Uninstall the GitHub App installations
    const uninstallResult = await uninstallGitHubApp();
    console.log("📱 App uninstall result:", uninstallResult);

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
