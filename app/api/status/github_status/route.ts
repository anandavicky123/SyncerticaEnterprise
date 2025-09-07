import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("github_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ connected: false });
    }

    // Verify token by making a simple API call
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
        user: {
          id: userData.id,
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url,
        },
      });
    } else {
      return NextResponse.json({ connected: false });
    }
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
