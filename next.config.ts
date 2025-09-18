import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Don't fail the production build on ESLint errors.
    // We still run `npm run type-check` to keep TS strictness.
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    // GitLab and Bitbucket removed — only GitHub is supported now
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  },
  // Suppress noisy webpack cache warnings like
  // "webpack.cache.PackFileCacheStrategy] Serializing big strings ..."
  // This reduces infrastructure logging to errors only.
  webpack: (config) => {
    config.infrastructureLogging = {
      ...(config.infrastructureLogging || {}),
      level: "error",
    } as any;
    return config;
  },
};

export default nextConfig;
