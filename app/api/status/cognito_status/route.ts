import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authStatus = cookieStore.get("auth_status")?.value;
    const userData = cookieStore.get("user_data")?.value;
    const accessToken = cookieStore.get("cognito_access_token")?.value;

    if (authStatus !== "authenticated" || !userData || !accessToken) {
      return NextResponse.json({
        connected: false,
        user: null,
        provider: null,
      });
    }

    // Parse user data
    let user;
    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      return NextResponse.json({
        connected: false,
        user: null,
        provider: null,
      });
    }

    // Optionally validate token with Cognito (recommended for production)
    if (process.env.VALIDATE_COGNITO_TOKEN === "true") {
      const cognitoConfig = {
        domain: process.env.COGNITO_DOMAIN,
        region: process.env.AWS_REGION || "us-east-1",
      };

      if (cognitoConfig.domain) {
        try {
          const userInfoEndpoint = `https://${cognitoConfig.domain}/oauth2/userInfo`;
          const userInfoResponse = await fetch(userInfoEndpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!userInfoResponse.ok) {
            // Token is invalid, clear cookies
            const response = NextResponse.json({
              connected: false,
              user: null,
              provider: null,
            });

            response.cookies.delete("auth_status");
            response.cookies.delete("user_data");
            response.cookies.delete("cognito_access_token");
            response.cookies.delete("cognito_refresh_token");
            response.cookies.delete("cognito_id_token");

            return response;
          }
        } catch (error) {
          console.warn("Token validation failed:", error);
          // Continue without validation in case of network issues
        }
      }
    }

    return NextResponse.json({
      connected: true,
      user: user,
      provider: "cognito",
      tokenExpiry: null, // Could be calculated from token if needed
    });
  } catch (error) {
    console.error("Cognito status check error:", error);
    return NextResponse.json({
      connected: false,
      user: null,
      provider: null,
      error: "Status check failed",
    });
  }
}

export async function DELETE(request: NextRequest) {
  // LOGOUT ENDPOINT REMOVED
}
