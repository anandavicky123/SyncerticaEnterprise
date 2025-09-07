import { NextRequest, NextResponse } from "next/server";
import { getSession } from "./lib/dynamodb";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/public")) {
    return NextResponse.next();
  }

  // Allow public endpoints without authentication
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/dashboard/select"
  ) {
    return NextResponse.next();
  }

  // Check for session in cookies
  const sessionId = request.cookies.get("session-id")?.value;
  console.log("Middleware - Session ID from cookie:", sessionId);
  console.log("Middleware - Current path:", pathname);

  if (!sessionId) {
    console.log("Middleware - No session ID found");
    // Redirect to login for protected routes
    // For API calls, return JSON 401 instead of redirecting to HTML login page
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    if (pathname.startsWith("/dashboard")) {
      console.log("Middleware - Redirecting to select page (no session)");
      return NextResponse.redirect(new URL("/dashboard/select", request.url));
    }

    return NextResponse.next();
  }

  try {
    console.log("Middleware - Validating session:", sessionId);
    // Validate session
    const session = await getSession(sessionId);
    console.log("Middleware - Session result:", session);

    if (!session) {
      console.log("Middleware - Invalid or expired session");
      // Invalid or expired session
      // For API calls, return JSON 401 so client-side fetch gets JSON, not HTML
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
      }

      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session-id");
      return response;
    }

    // Add session info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-session-id', sessionId);
    requestHeaders.set('x-actor-type', session.actorType);
    requestHeaders.set('x-actor-id', session.actorId);
      // Helper to always continue the request while forwarding headers
      const nextWithHeaders = () =>
        NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

    // For worker sessions accessing non-worker pages
    if (session.actorType === 'worker') {
      if (pathname.startsWith('/dashboard')) {
        console.log('Middleware - Worker attempting to access dashboard, redirecting to workers area');
        // If this is an API call, return 403 JSON
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/workers/management', request.url));
      }
      // Allow workers to access /workers paths
      if (pathname.startsWith('/workers')) {
        console.log('Middleware - Worker accessing workers area');
              return nextWithHeaders();
      }
    }

    // For manager sessions accessing non-manager pages (skip API routes)
    if (session.actorType === 'manager' && !pathname.startsWith('/dashboard') && !pathname.startsWith('/api')) {
      console.log('Middleware - Manager redirected to dashboard');
      return NextResponse.redirect(new URL('/dashboard/manager', request.url));
    }

    // Route protection based on user type
    if (pathname.startsWith("/workers")) {
      // Allow both workers and managers to access workers area
      if (session.actorType !== "worker" && session.actorType !== "manager") {
        console.log("Middleware - Non-worker/manager attempting to access workers area");
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    if (pathname.startsWith("/dashboard")) {
      if (session.actorType !== "manager") {
        console.log("Middleware - Non-manager attempting to access dashboard");
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard/select", request.url));
      }
    }

    // Continue with the request, adding session headers
    return nextWithHeaders();
  } catch (error) {
    console.error("Middleware error:", error);
    // For API calls, return JSON error; for pages redirect to select
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Middleware error' }, { status: 500 });
    }
    const response = NextResponse.redirect(new URL("/dashboard/select", request.url));
    response.cookies.delete("session-id");
    return response;
  }
}

export const config = {
  matcher: [
    // Match all API routes except auth endpoints
    "/api/((?!auth).*)",
    // Match all page routes except static files and assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
