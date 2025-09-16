import { NextRequest, NextResponse } from "next/server";

// Route to handle manager profile (name + email) separately from preferences.

export async function GET(req: NextRequest) {
  const managerDeviceUUID =
    req.headers.get("x-actor-id") ||
    req.nextUrl.searchParams.get("managerDeviceUUID");
  if (!managerDeviceUUID) {
    return NextResponse.json(
      { error: "managerDeviceUUID required" },
      { status: 400 }
    );
  }

  try {
    const prisma = (await import("../../../../lib/database")).prisma;
    const manager = await prisma.manager.findUnique({
      where: { deviceUUID: managerDeviceUUID },
      select: {
        name: true,
        email: true,
      },
    });

    if (!manager)
      return NextResponse.json({ error: "not found" }, { status: 404 });

    console.log(
      "[manager/profile GET] profile for",
      managerDeviceUUID,
      "->",
      manager
    );

    return NextResponse.json({
      name: manager.name ?? null,
      email: manager.email ?? null,
    });
  } catch (error) {
    console.error("Error reading manager profile:", error);
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
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { name, email } = body;
    const prisma = (await import("../../../../lib/database")).prisma;

    const updateData: any = {};
    if (typeof name !== "undefined") updateData.name = name;
    if (typeof email !== "undefined") updateData.email = email;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true });
    }

    console.log(
      "[manager/profile PUT] updating profile for",
      managerDeviceUUID,
      "->",
      updateData
    );

    await prisma.manager.update({
      where: { deviceUUID: managerDeviceUUID },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating manager profile:", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
