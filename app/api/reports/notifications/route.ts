import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "../../../../lib/dynamodb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "";
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const items = await getNotifications(userId);
  return NextResponse.json(items);
}
