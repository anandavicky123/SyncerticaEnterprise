import { NextRequest, NextResponse } from "next/server";
import { queryProjectReports } from "../../../../lib/dynamodb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || "";
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  const items = await queryProjectReports(projectId);
  return NextResponse.json(items);
}
