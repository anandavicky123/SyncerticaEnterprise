import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/rds-database";

const db = getDatabase();

export async function GET(req: NextRequest) {
  // Try to get managerDeviceUUID from headers injected by middleware
  const managerDeviceUUID = req.headers.get("x-actor-id") || req.nextUrl.searchParams.get("managerDeviceUUID");
  if (!managerDeviceUUID) {
    return NextResponse.json({ error: "managerDeviceUUID required" }, { status: 400 });
  }

  try {
    // Use prisma directly through rds-database instance
    // rds-database doesn't expose a getManager method, so use prisma via import if needed
    const prisma = (await import("../../../../lib/database")).prisma;
    const manager = await prisma.manager.findUnique({
      where: { deviceUUID: managerDeviceUUID },
    });

    if (!manager) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json({
      dateFormat: manager.dateFormat || "YYYY-MM-DD",
      timeFormat: manager.timeFormat || "24h",
      language: manager.language || "en",
    });
  } catch (error) {
    console.error("Error reading manager settings:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const managerDeviceUUID = req.headers.get("x-actor-id") || req.nextUrl.searchParams.get("managerDeviceUUID");
  if (!managerDeviceUUID) {
    return NextResponse.json({ error: "managerDeviceUUID required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { dateFormat, timeFormat, language } = body;
    const prisma = (await import("../../../../lib/database")).prisma;

    const updated = await prisma.manager.update({
      where: { deviceUUID: managerDeviceUUID },
      data: {
        dateFormat: dateFormat,
        timeFormat: timeFormat,
        language,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating manager settings:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
