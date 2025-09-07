import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    // Get session from headers (set by middleware)
    const actorType = request.headers.get('x-actor-type');
    const actorId = request.headers.get('x-actor-id');

    if (actorType !== 'manager') {
      return NextResponse.json(
        { error: 'Unauthorized - Manager access required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const lastEvaluatedKey = searchParams.get('lastEvaluatedKey') 
      ? JSON.parse(searchParams.get('lastEvaluatedKey')!) 
      : undefined;

    const result = await getAuditLogs(limit, lastEvaluatedKey);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: 'Failed to get audit logs' },
      { status: 500 }
    );
  }
}