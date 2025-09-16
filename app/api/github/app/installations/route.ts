import { NextResponse } from 'next/server';
import { getInstallations } from '@/lib/github-app';

/**
 * Get GitHub App installations for the authenticated app
 */
export async function GET() {
  try {
    console.log('Checking GitHub App installations...');
    
    // Get all installations for this GitHub App
    const installations = await getInstallations();
    
    console.log(`Found ${installations.length} installations`);
    
    return NextResponse.json({
      success: true,
      installed: installations.length > 0,
      installations: installations.map(installation => ({
        id: installation.id,
        account: {
          login: installation.account.login,
          id: installation.account.id,
          type: installation.account.type,
        },
        repository_selection: installation.repository_selection,
        permissions: installation.permissions,
        created_at: installation.created_at,
        updated_at: installation.updated_at,
        suspended_at: installation.suspended_at,
      })),
      count: installations.length,
    });
  } catch (error) {
    console.error('Error fetching GitHub App installations:', error);
    
    return NextResponse.json(
      {
        success: false,
        installed: false,
        installations: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch installations',
      },
      { status: 500 }
    );
  }
}