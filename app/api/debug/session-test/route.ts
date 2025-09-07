import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSession } from '@/lib/dynamodb';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing session creation and retrieval...');
    
    // Test creating a session
    const sessionId = await createSession('manager', 'test-manager-123');
    console.log('Created session:', sessionId);
    
    // Test retrieving the session
    const session = await getSession(sessionId);
    console.log('Retrieved session:', session);
    
    return NextResponse.json({
      success: true,
      sessionId,
      session,
      message: 'Session test completed successfully'
    });
  } catch (error) {
    console.error('Session test error:', error);
    return NextResponse.json(
      { 
        error: 'Session test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}