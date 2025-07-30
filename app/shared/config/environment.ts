// Simplified environment configuration
// All credentials are loaded from environment variables (.env locally, Vercel secrets in production)

// Helper functions for easy access to environment variables
export const getGitHubToken = (): string => {
  return process.env.GITHUB_TOKEN || "";
};

export const getAWSCredentials = () => {
  return {
    accessKey: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "us-east-1",
  };
};

export const getDockerCredentials = () => {
  return {
    username: process.env.DOCKERHUB_USERNAME || "",
    token: process.env.DOCKERHUB_TOKEN || "",
  };
};

export const getAPIConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  return {
    baseUrl:
      process.env.NEXT_PUBLIC_API_URL ||
      (isDevelopment
        ? "http://localhost:3000/api"
        : "https://api.syncertica.com"),
    timeout: isDevelopment ? 30000 : 10000,
  };
};

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

// Configuration summary for debugging (safe - doesn't expose actual credentials)
export const getConfigSummary = () => {
  const github = getGitHubToken();
  const aws = getAWSCredentials();
  const docker = getDockerCredentials();
  const api = getAPIConfig();

  return {
    environment: process.env.NODE_ENV || "unknown",
    github: {
      hasToken: !!github,
      tokenPreview: github ? `${github.substring(0, 8)}...` : "Not set",
    },
    aws: {
      hasAccessKey: !!aws.accessKey,
      hasSecretKey: !!aws.secretAccessKey,
      region: aws.region,
      accessKeyPreview: aws.accessKey
        ? `${aws.accessKey.substring(0, 8)}...`
        : "Not set",
    },
    docker: {
      hasUsername: !!docker.username,
      hasToken: !!docker.token,
      usernamePreview: docker.username ? `${docker.username}` : "Not set",
    },
    api: api,
  };
};
