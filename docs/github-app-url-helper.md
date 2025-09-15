/**
 * GitHub App URL Helper
 * 
 * To find your GitHub App's installation URL:
 * 
 * 1. Go to https://github.com/settings/apps
 * 2. Click on your "Syncertica Enterprise" app
 * 3. Look at the URL, it should be something like:
 *    https://github.com/settings/apps/your-app-slug
 * 4. Your installation URL will be:
 *    https://github.com/apps/your-app-slug/installations/new
 * 
 * Common GitHub App slug formats:
 * - App Name: "Syncertica Enterprise" → Slug: "syncertica-enterprise"
 * - App Name: "My App" → Slug: "my-app"
 * - App Name: "SyncerticaEnterprise" → Slug: "syncerticaenterprise"
 * 
 * Steps to update:
 * 1. Find your app slug from GitHub
 * 2. Update the appSlug variable in getGitHubAppInstallUrl()
 * 3. Test the installation URL
 */

// Try these URLs to find which one works for your app:
export const possibleInstallationUrls = [
  'https://github.com/apps/syncertica-enterprise/installations/new',
  'https://github.com/apps/syncerticaenterprise/installations/new', 
  'https://github.com/apps/syncertica/installations/new',
  'https://github.com/apps/enterprise/installations/new',
  // Add more variations as needed
];

console.log('Possible GitHub App installation URLs:', possibleInstallationUrls);
console.log('Test each URL manually to find the correct one for your GitHub App');