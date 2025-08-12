import { NextResponse } from "next/server";
import {
  generateOAuthUrl,
  getOAuthCallbackUrl,
} from "../../../shared/utils/oauth";

export async function GET() {
  console.log("🧪 OAuth Test endpoint called");

  try {
    const clientId = process.env.NEXT_PUBLIC_BITBUCKET_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_BITBUCKET_CLIENT_ID not found",
          status: "error",
        },
        { status: 400 }
      );
    }

    // Test different scope combinations
    const scopeTests = [
      "repositories",
      "account",
      "repositories account",
      "repositories account email",
      "repository",
      "repository:read account",
    ];

    const results = scopeTests.map((scope) => {
      try {
        const url = generateOAuthUrl("bitbucket", clientId, scope, {
          response_type: "code",
        });
        return {
          scope,
          url,
          status: "success",
        };
      } catch (error) {
        return {
          scope,
          error: error instanceof Error ? error.message : "Unknown error",
          status: "error",
        };
      }
    });

    const callbackUrl = getOAuthCallbackUrl("bitbucket");

    return NextResponse.json({
      message: "Bitbucket OAuth URL Test",
      clientId: clientId ? "Present" : "Missing",
      callbackUrl,
      scopeTests: results,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ OAuth test error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      { status: 500 }
    );
  }
}
