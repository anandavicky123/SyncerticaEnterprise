/**
 * GitHub App Installation Utilities
 */

interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    id: number;
    type: string;
  };
  repository_selection: 'all' | 'selected';
  permissions: Record<string, string>;
  created_at: string;
  updated_at: string;
}

/**
 * Get the GitHub App installation URL
 */
export function getGitHubAppInstallUrl(): string {
  // IMPORTANT: Replace 'your-app-slug' with your actual GitHub App slug
  // To find your app slug:
  // 1. Go to https://github.com/settings/apps
  // 2. Click on your app
  // 3. The URL will show: https://github.com/settings/apps/YOUR-APP-SLUG
  // 4. Use that slug below
  
  // Common variations for "Syncertica Enterprise":
  const possibleSlugs = [
    'syncertica-enterprise',
    'syncerticaenterprise', 
    'syncertica',
  ];
  
  // Use the first one by default - update this when you find the correct slug
  const appSlug = possibleSlugs[0];
  
  return `https://github.com/apps/${appSlug}/installations/new`;
}

/**
 * Get all possible installation URLs for testing
 */
export function getAllPossibleInstallUrls(): string[] {
  const possibleSlugs = [
    'syncertica-enterprise',
    'syncerticaenterprise', 
    'syncertica',
    'enterprise',
  ];
  
  return possibleSlugs.map(slug => `https://github.com/apps/${slug}/installations/new`);
}

/**
 * Check if GitHub App is installed for the current user/organization
 */
export async function checkGitHubAppInstallation(): Promise<{
  installed: boolean;
  installations: GitHubInstallation[];
  error?: string;
}> {
  try {
    const response = await fetch('/api/github/app/installations');
    
    if (!response.ok) {
      return {
        installed: false,
        installations: [],
        error: `Failed to check installations: ${response.status}`
      };
    }
    
    const data = await response.json();
    
    return {
      installed: Array.isArray(data.installations) && data.installations.length > 0,
      installations: data.installations || [],
    };
  } catch (error) {
    console.error('Error checking GitHub App installation:', error);
    return {
      installed: false,
      installations: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle GitHub App installation callback
 */
export function handleGitHubAppCallback(code: string, installationId?: string): Promise<{ success: boolean; error?: string; data?: unknown }> {
  return fetch('/api/github/app/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      installation_id: installationId,
    }),
  }).then(response => response.json());
}