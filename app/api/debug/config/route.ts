import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      github: {
        clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
          ? "✅ Present"
          : "❌ Missing",
        clientSecret: process.env.GITHUB_CLIENT_SECRET
          ? "✅ Present"
          : "❌ Missing",
      },
      gitlab: {
        applicationId: process.env.NEXT_PUBLIC_GITLAB_APPLICATION_ID
          ? "✅ Present"
          : "❌ Missing",
        secret: process.env.GITLAB_SECRET ? "✅ Present" : "❌ Missing",
      },
      bitbucket: {
        clientId: process.env.NEXT_PUBLIC_BITBUCKET_CLIENT_ID
          ? "✅ Present"
          : "❌ Missing",
        clientSecret: process.env.BITBUCKET_CLIENT_SECRET
          ? "✅ Present"
          : "❌ Missing",
      },
    };

    return NextResponse.json({
      success: true,
      config,
      message: "Configuration check completed",
    });
  } catch (error) {
    console.error("Configuration check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check configuration",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
