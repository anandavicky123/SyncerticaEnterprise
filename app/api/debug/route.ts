import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "OAuth debug endpoint",
    env_vars: {
      github_client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
        ? "✅ Set"
        : "❌ Missing",
      gitlab_application_id: process.env.NEXT_PUBLIC_GITLAB_APPLICATION_ID
        ? "✅ Set"
        : "❌ Missing",
      bitbucket_client_id: process.env.NEXT_PUBLIC_BITBUCKET_CLIENT_ID
        ? "✅ Set"
        : "❌ Missing",
      base_url: process.env.NEXT_PUBLIC_BASE_URL || "Not set",
    },
    auth_urls: {
      github: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/auth/github_auth`,
      gitlab: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/auth/gitlab_auth`,
      bitbucket: `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/auth/bitbucket_auth`,
    },
    client_ids: {
      github: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      gitlab: process.env.NEXT_PUBLIC_GITLAB_APPLICATION_ID,
      bitbucket: process.env.NEXT_PUBLIC_BITBUCKET_CLIENT_ID,
    },
  });
}
