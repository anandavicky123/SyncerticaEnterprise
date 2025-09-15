import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInstallations } from "@/lib/github-app";

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
    const response = NextResponse.json({ success: true });
    response.cookies.delete("github_access_token");
    response.cookies.delete("github_user");
    return response;
  } catch (error) {
    console.error("Error disconnecting GitHub:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
