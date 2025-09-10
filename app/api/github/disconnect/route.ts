import { NextResponse } from "next/server";

export async function GET() {
  // Use absolute URL for redirect
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/dashboard", baseUrl));

  try {
    // remove the actual cookies used by the OAuth flow
    response.cookies.delete("github_access_token");
    response.cookies.delete("github_user");
    // fallback/legacy names
    response.cookies.delete("github_token");
    response.cookies.delete("github_oauth_state");
  } catch (e) {
    console.error("Error clearing GitHub cookies:", e);
  }

  return response;
}
