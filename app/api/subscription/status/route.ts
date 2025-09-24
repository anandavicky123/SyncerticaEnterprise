import { NextRequest, NextResponse } from "next/server";

// In the future, this would check against a proper subscriptions table
// For now, we'll use a mock implementation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json(
        { error: "Manager ID is required" },
        { status: 400 },
      );
    }

    // In a real implementation, we would check a subscriptions table
    // For now, all managers are on the free tier
    return NextResponse.json({
      isPro: false,
      subscription: {
        tier: "free",
        features: {
          maxWorkers: 7,
          auditLogs: false,
          prioritySupport: false,
        },
      },
    });
  } catch (error) {
    console.error("Subscription status check error:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 },
    );
  }
}
