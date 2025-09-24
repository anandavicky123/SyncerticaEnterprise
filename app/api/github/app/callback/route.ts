import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/dynamodb";
import { prisma } from "@/lib/rds-database";
import { Prisma } from "@prisma/client";
import { getInstallations } from "@/lib/github-app";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("session-id")?.value;
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "No session" },
        { status: 401 },
      );
    }

    const session = await getSession(sessionId);
    if (!session || session.actorType !== "manager") {
      return NextResponse.json(
        { success: false, error: "Invalid session or not a manager" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const installationId = body.installation_id;

    if (!installationId) {
      return NextResponse.json(
        { success: false, error: "installation_id required" },
        { status: 400 },
      );
    }

    // Validate that the installation id belongs to this GitHub App
    try {
      const installations = await getInstallations();
      const found = installations.find(
        (i) => String(i.id) === String(installationId),
      );
      if (!found) {
        return NextResponse.json(
          {
            success: false,
            error: "Installation id not found for this GitHub App",
          },
          { status: 404 },
        );
      }
    } catch (err) {
      console.error("Error validating installations from GitHub:", err);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to validate installation with GitHub",
        },
        { status: 500 },
      );
    }

    // Persist installation id on manager row
    try {
      const managerDelegate: any = (prisma as any).manager;
      const updated = await managerDelegate.update({
        where: { deviceUUID: session.actorId },
        data: { githubAppId: String(installationId) },
      });

      return NextResponse.json({
        success: true,
        data: { manager: { deviceUUID: updated.deviceUUID } },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Installation already linked to another manager",
          },
          { status: 409 },
        );
      }
      console.error("Error persisting installation id:", err);
      return NextResponse.json(
        { success: false, error: "Failed to persist installation" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Callback handler error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "GitHub app callback endpoint",
  });
}
