/**
 * Utility functions for handling dynamic port detection
 */

// Get the current origin (protocol + hostname + port)
export const getCurrentOrigin = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Fallback for server-side
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};

// Get the current base URL for API calls
export const getApiBaseUrl = (): string => {
  return `${getCurrentOrigin()}/api`;
};

// Generate OAuth callback URL for any provider
export const getOAuthCallbackUrl = (provider: string): string => {
  return `${getCurrentOrigin()}/api/auth/${provider}_auth`;
};

// Generate OAuth authorization URL
export const generateOAuthUrl = (
  provider: string,
  clientId: string,
  scope: string,
  additionalParams?: Record<string, string>
): string => {
  console.log("🔧 generateOAuthUrl called with:", {
    provider,
    clientId: clientId ? "Present" : "Missing",
    scope,
  });

  const redirectUri = getOAuthCallbackUrl(provider);
  console.log("📍 Callback URL:", redirectUri);

  const state = Math.random().toString(36).substring(7);

  const baseParams = {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    state: state,
  };

  const allParams = { ...baseParams, ...additionalParams };
  const searchParams = new URLSearchParams();

  Object.entries(allParams).forEach(([key, value]) => {
    searchParams.append(key, value);
  });

  const baseUrls = {
    github: "https://github.com/login/oauth/authorize",
    gitlab: "https://gitlab.com/oauth/authorize",
    bitbucket: "https://bitbucket.org/site/oauth2/authorize",
  };

  const baseUrl = baseUrls[provider as keyof typeof baseUrls];
  if (!baseUrl) {
    console.error("❌ Unsupported OAuth provider:", provider);
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const finalUrl = `${baseUrl}?${searchParams.toString()}`;
  console.log("🎯 Final OAuth URL:", finalUrl);
  return finalUrl;
};
