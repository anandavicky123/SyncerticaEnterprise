import { NextRequest, NextResponse } from "next/server";
import { queryPerformanceMetrics } from "../../../../lib/dynamodb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const items = await queryPerformanceMetrics(id);
  return NextResponse.json(items);
}
