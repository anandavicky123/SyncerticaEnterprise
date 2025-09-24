import { createSign } from "crypto";

/**
 * GitHub App Authentication Utilities
 */

export interface GitHubAppConfig {
  appId: string;
  clientId: string;
  privateKey: string;
  webhookSecret?: string;
}

export interface InstallationToken {
  token: string;
  expires_at: string;
  permissions: Record<string, string>;
  repository_selection: "all" | "selected";
}

export interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    id: number;
    type: string;
  };
  repository_selection: "all" | "selected";
  permissions: Record<string, string>;
  created_at: string;
  updated_at: string;
  suspended_at?: string;
}

/**
 * Load GitHub App configuration from environment variables
 */
export function getGitHubAppConfig(): GitHubAppConfig {
  const appId = process.env.GITHUB_APP_ID;
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;

  if (!appId || !clientId || !privateKey) {
    throw new Error(
      "Missing GitHub App configuration. Please set GITHUB_APP_ID, GITHUB_APP_CLIENT_ID, and GITHUB_APP_PRIVATE_KEY in your environment variables.",
    );
  }

  return {
    appId,
    clientId,
    // Normalize private key: some env setups store newlines as literal \n
    privateKey: privateKey
      ? privateKey.replace(/\\n/g, "\n").trim()
      : privateKey,
    webhookSecret,
  };
}

/**
 * Generate a JWT token for GitHub App authentication
 */
export function generateAppJWT(): string {
  const config = getGitHubAppConfig();

  try {
    // Use the private key directly from environment variable
    const privateKey = config.privateKey;

    // JWT Header
    const header = {
      alg: "RS256",
      typ: "JWT",
    };

    // JWT Payload
    const now = Math.floor(Date.now() / 1000);
    // GitHub requires exp - iat <= 600 seconds. Use a slightly smaller window
    // to avoid clock skew issues. Use 9 minutes (540 seconds).
    const payload = {
      iat: now,
      exp: now + 540, // Expires in 9 minutes
      iss: config.appId,
    };

    // Helper to base64url encode a Buffer
    const base64Url = (buf: Buffer) =>
      buf
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

    const headerB64Url = base64Url(Buffer.from(JSON.stringify(header)));
    const payloadB64Url = base64Url(Buffer.from(JSON.stringify(payload)));

    // Create signature over header.payload
    const signingInput = `${headerB64Url}.${payloadB64Url}`;
    const signer = createSign("RSA-SHA256");
    signer.update(signingInput);
    signer.end();

    // Sign using the private key; result is base64 which we convert to base64url
    const signatureBase64 = signer.sign(privateKey, "base64");
    const signature = signatureBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

    // Debugging: log iat/exp and a hint if the private key looks malformed
    // Safe debug logging - don't throw from logging
    try {
      console.debug(
        `🔑 GitHub App JWT payload: iat=${payload.iat} exp=${payload.exp} iss=${payload.iss}`,
      );
      if (!privateKey || !privateKey.includes("BEGIN")) {
        console.warn(
          "⚠️ GitHub private key may be malformed or missing BEGIN/END header. Did you forget to normalize newlines?",
        );
      }
    } catch {
      // ignore logging errors
    }

    return `${signingInput}.${signature}`;
  } catch (error) {
    console.error("Failed to generate GitHub App JWT:", error);
    throw new Error("Failed to generate GitHub App JWT token");
  }
}

/**
 * Get installations for this GitHub App
 */
export async function getInstallations(): Promise<GitHubInstallation[]> {
  const jwt = generateAppJWT();

  try {
    const response = await fetch("https://api.github.com/app/installations", {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch installations: ${response.status} ${errorText}`,
      );
    }

    const installations = await response.json();
    return installations;
  } catch (error) {
    console.error("Error fetching installations:", error);
    throw error;
  }
}

/**
 * Get an installation access token for a specific installation
 */
export async function getInstallationToken(
  installationId: number,
): Promise<InstallationToken> {
  const jwt = generateAppJWT();

  try {
    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get installation token: ${response.status} ${errorText}`,
      );
    }

    const token = await response.json();
    return token;
  } catch (error) {
    console.error("Error getting installation token:", error);
    throw error;
  }
}

/**
 * Get installation token for a specific repository
 */
export async function getInstallationTokenForRepo(
  owner: string,
  repo: string,
): Promise<InstallationToken | null> {
  try {
    const installations = await getInstallations();

    // Find installation that has access to this repository
    for (const installation of installations) {
      // If it's an organization installation and the owner matches
      if (installation.account.login === owner) {
        return await getInstallationToken(installation.id);
      }

      // For user installations, we need to check if they have access to the repo
      // This requires checking the repositories endpoint for the installation
      try {
        const installationToken = await getInstallationToken(installation.id);

        // Test if this token can access the specific repository
        const repoResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}`,
          {
            headers: {
              Authorization: `token ${installationToken.token}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          },
        );

        if (repoResponse.ok) {
          return installationToken;
        }
      } catch {
        // Continue to next installation
        console.warn(
          `Installation ${installation.id} doesn't have access to ${owner}/${repo}`,
        );
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting installation token for repository:", error);
    throw error;
  }
}

/**
 * Make an authenticated GitHub API request using GitHub App
 */
export async function makeGitHubAppRequest(
  url: string,
  options: RequestInit = {},
  installationId?: number,
): Promise<Response> {
  let token: string;

  if (installationId) {
    // Use installation token
    const installationToken = await getInstallationToken(installationId);
    token = installationToken.token;
  } else {
    // Use JWT for app-level operations
    token = generateAppJWT();
  }

  const headers = {
    Authorization: installationId ? `token ${token}` : `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Uninstall all GitHub App installations for the current app
 */
export async function uninstallGitHubApp(): Promise<{
  success: boolean;
  message: string;
  uninstalledCount: number;
}> {
  try {
    const installations = await getInstallations();

    if (installations.length === 0) {
      return {
        success: true,
        message: "No installations found to uninstall",
        uninstalledCount: 0,
      };
    }

    const jwt = generateAppJWT();
    let uninstalledCount = 0;
    const errors: string[] = [];

    // Uninstall each installation
    for (const installation of installations) {
      try {
        const response = await fetch(
          `https://api.github.com/app/installations/${installation.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${jwt}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
          },
        );

        if (response.ok || response.status === 404) {
          // 404 means already uninstalled, which is fine
          uninstalledCount++;
          console.log(
            `✅ Uninstalled app from ${installation.account.login} (installation ${installation.id})`,
          );
        } else {
          const errorText = await response.text();
          const errorMsg = `Failed to uninstall from ${installation.account.login}: ${response.status} ${errorText}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Error uninstalling from ${
          installation.account.login
        }: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: `Partially uninstalled: ${uninstalledCount} successful, ${
          errors.length
        } failed. Errors: ${errors.join("; ")}`,
        uninstalledCount,
      };
    }

    return {
      success: true,
      message: `Successfully uninstalled GitHub App from ${uninstalledCount} installation(s)`,
      uninstalledCount,
    };
  } catch (error) {
    console.error("Error uninstalling GitHub App:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      uninstalledCount: 0,
    };
  }
}

/**
 * Trigger a workflow using GitHub App authentication
 */
export async function triggerWorkflowWithApp(
  owner: string,
  repo: string,
  workflowId: string | number,
  ref: string = "main",
  inputs: Record<string, string | number | boolean> = {},
): Promise<{ success: boolean; message: string; data?: unknown }> {
  try {
    // Get installation token for this repository
    const installationToken = await getInstallationTokenForRepo(owner, repo);

    if (!installationToken) {
      return {
        success: false,
        message: `No GitHub App installation found for repository ${owner}/${repo}. Please install the GitHub App on this repository.`,
      };
    }

    // Make the workflow dispatch request
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `token ${installationToken.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref, inputs }),
    });

    if (response.ok) {
      return {
        success: true,
        message: "Workflow triggered successfully",
      };
    } else {
      const errorData = await response.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.message || errorData;
      } catch {
        errorMessage = errorData;
      }

      return {
        success: false,
        message: `Failed to trigger workflow: ${response.status} ${errorMessage}`,
        data: errorData,
      };
    }
  } catch (error) {
    console.error("Error triggering workflow with GitHub App:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
