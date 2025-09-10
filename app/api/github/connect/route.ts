import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub Client ID not configured" },
      { status: 500 }
    );
  }

  const redirectUri = `${baseUrl}/api/auth/github_auth`;
  const scope = "repo,user,workflow,admin:repo_hook";
  const state = Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
  });

  const oauthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  const response = NextResponse.redirect(oauthUrl);
  // store state short-lived to validate callback if desired
  response.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 5, // 5 minutes
  });

  return response;
}
