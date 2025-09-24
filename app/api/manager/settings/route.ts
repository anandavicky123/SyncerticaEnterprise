import { NextRequest, NextResponse } from "next/server";

// This route now only handles manager preferences (dateFormat/timeFormat).
// Name/email are handled in a separate `profile` route.

export async function GET(req: NextRequest) {
  const managerDeviceUUID =
    req.headers.get("x-actor-id") ||
    req.nextUrl.searchParams.get("managerDeviceUUID");
  if (!managerDeviceUUID) {
    return NextResponse.json(
      { error: "managerDeviceUUID required" },
      { status: 400 },
    );
  }

  try {
    const prisma = (await import("../../../../lib/database")).prisma;
    const manager = await prisma.manager.findUnique({
      where: { deviceUUID: managerDeviceUUID },
      select: {
        dateFormat: true,
        timeFormat: true,
      },
    });

    if (!manager)
      return NextResponse.json({ error: "not found" }, { status: 404 });

    console.log(
      "[manager/settings GET] prefs for",
      managerDeviceUUID,
      "->",
      manager,
    );

    const response: any = {};
    if (manager.dateFormat) response.dateFormat = manager.dateFormat;
    if (manager.timeFormat) response.timeFormat = manager.timeFormat;

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error reading manager settings:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const managerDeviceUUID =
    req.headers.get("x-actor-id") ||
    req.nextUrl.searchParams.get("managerDeviceUUID");
  if (!managerDeviceUUID) {
    return NextResponse.json(
      { error: "managerDeviceUUID required" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const { dateFormat, timeFormat } = body;
    const prisma = (await import("../../../../lib/database")).prisma;

    const updateData: any = {};
    if (typeof dateFormat !== "undefined") updateData.dateFormat = dateFormat;
    if (typeof timeFormat !== "undefined") updateData.timeFormat = timeFormat;

    if (Object.keys(updateData).length > 0) {
      console.log(
        "[manager/settings PUT] updating prefs for",
        managerDeviceUUID,
        "->",
        updateData,
      );
      await prisma.manager.update({
        where: { deviceUUID: managerDeviceUUID },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating manager settings:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
