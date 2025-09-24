import { useState, useEffect, useCallback } from "react";

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  filename: string;
  path: string;
  state: string;
  status: string;
  conclusion: string;
  html_url: string;
  repository: string;
  updated_at: string;
  workflow_id?: string | number;
}

export interface Infrastructure {
  id: string;
  name: string;
  type: string;
  path: string;
  content: string;
  repository: string;
}

export interface Container {
  id: string;
  name: string;
  type: string;
  path: string;
  content: string;
  repository: string;
}

interface GitHubConnectionStatus {
  connected: boolean;
  user?: {
    login: string;
    name: string;
    avatar_url: string;
  };
}

export const useGitHubData = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [infrastructure, setInfrastructure] = useState<Infrastructure[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<GitHubConnectionStatus>({
      connected: false,
    });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const checkConnection = useCallback(async () => {
    try {
      // include credentials so the server can read per-browser flags (github_app_disabled)
      const response = await fetch("/api/status/github_status", {
        credentials: "include",
      });
      const data = await response.json();
      setConnectionStatus({
        connected: data.connected,
        user: data.user,
      });
      return data.connected;
    } catch (error) {
      console.error("Error checking GitHub connection:", error);
      setConnectionStatus({ connected: false });
      return false;
    }
  }, []);

  const refreshData = useCallback(
    async (force = false) => {
      console.log("🔄 Starting refreshData function");

      // Prevent multiple rapid calls (10 second cooldown)
      const now = Date.now();
      if (!force && now - lastFetchTime < 10 * 1000 && containers.length > 0) {
        console.log("⏭️ Skipping refresh, recent data available");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🔍 Checking GitHub connection...");
        const isConnected = await checkConnection();
        console.log("📡 Connection status:", isConnected);

        if (isConnected) {
          // Fetch repositories first
          console.log("📂 Fetching repositories...");
          const reposResponse = await fetch(
            "/api/repositories/github_repositories",
          );
          console.log("📂 Repositories response status:", reposResponse.status);

          if (reposResponse.ok) {
            const reposData = await reposResponse.json();
            const fetchedRepositories = reposData.repositories || [];
            console.log("📂 Fetched repositories:", fetchedRepositories.length);
            setRepositories(fetchedRepositories);

            // Fetch containers
            console.log("📦 Fetching containers...");
            const containersResponse = await fetch(
              "/api/containers/github_containers",
            );
            console.log(
              "📦 Container response status:",
              containersResponse.status,
            );

            if (containersResponse.ok) {
              const containersData = await containersResponse.json();
              const fetchedContainers = containersData.containers || [];
              console.log("📦 Fetched containers:", fetchedContainers.length);
              setContainers(fetchedContainers);
            } else {
              console.error("📦 Container fetch failed");
              setContainers([]);
            }

            // Fetch workflows and infrastructure in parallel across repositories
            console.log(
              "🔧 Fetching workflows and infrastructure for",
              fetchedRepositories.length,
              "repositories (in parallel)",
            );

            const workflowPromises = fetchedRepositories.map(
              async (repo: Repository) => {
                try {
                  const workflowResponse = await fetch(
                    `/api/workflows/github_workflows?repo=${repo.full_name}`,
                  );
                  if (workflowResponse.ok) {
                    const workflowData = await workflowResponse.json();
                    return (workflowData.workflows || []).map(
                      (workflow: Workflow) => ({
                        ...workflow,
                        repository: repo.full_name,
                      }),
                    );
                  }
                } catch (error) {
                  console.error(
                    `Error fetching workflows for ${repo.full_name}:`,
                    error,
                  );
                }
                return [] as Workflow[];
              },
            );

            const infraPromises = fetchedRepositories.map(
              async (repo: Repository) => {
                try {
                  const infraResponse = await fetch(
                    `/api/infrastructure/github_infrastructure?repo=${repo.full_name}`,
                  );
                  if (infraResponse.ok) {
                    const infraData = await infraResponse.json();
                    return (infraData.infrastructure || []).map(
                      (infra: Infrastructure) => ({
                        ...infra,
                        repository: repo.full_name,
                      }),
                    );
                  }
                } catch (error) {
                  console.error(
                    `Error fetching infrastructure for ${repo.full_name}:`,
                    error,
                  );
                }
                return [] as Infrastructure[];
              },
            );

            const workflowsByRepo = await Promise.all(workflowPromises);
            const infraByRepo = await Promise.all(infraPromises);

            const allWorkflows = workflowsByRepo.flat();
            const allInfrastructure = infraByRepo.flat();

            console.log(`✅ Setting workflows: ${allWorkflows.length} total`);
            console.log(
              `✅ Setting infrastructure: ${allInfrastructure.length} total`,
            );
            setWorkflows(allWorkflows);
            setInfrastructure(allInfrastructure);
          } else {
            console.error("📂 Repository fetch failed");
            setRepositories([]);
            setContainers([]);
            setWorkflows([]);
            setInfrastructure([]);
          }
        } else {
          console.log("📡 Not connected, clearing all data");
          setRepositories([]);
          setContainers([]);
          setWorkflows([]);
          setInfrastructure([]);
        }
      } catch (error) {
        console.error("Error refreshing data:", error);
        setError("Failed to refresh data");
      } finally {
        setLoading(false);
        setLastFetchTime(Date.now());
        console.log("🔄 RefreshData complete");
      }
    },
    [checkConnection, lastFetchTime, containers.length],
  );

  const connectToGitHub = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (clientId) {
      const redirectUri = `${window.location.origin}/api/auth/github_auth`;
      const scope = "repo,user,workflow,admin:repo_hook";
      const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
      window.location.href = oauthUrl;
    } else {
      setError("GitHub Client ID is not configured");
    }
  }, []);

  const disconnectFromGitHub = useCallback(async () => {
    try {
      const response = await fetch("/api/status/github_status", {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setConnectionStatus({ connected: false });
        setRepositories([]);
        setWorkflows([]);
        setInfrastructure([]);
        setContainers([]);
        // Re-run a full refresh so server-side status (including App detection)
        // is re-evaluated and the UI reflects the persisted disconnect.
        try {
          await refreshData();
        } catch {
          // ignore refresh errors during disconnect
        }
      }
    } catch (error) {
      console.error("Error disconnecting from GitHub:", error);
      setError("Failed to disconnect from GitHub");
    }
  }, [refreshData]);

  useEffect(() => {
    // Only run refreshData once on mount
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  return {
    repositories,
    workflows,
    infrastructure,
    containers,
    connectionStatus,
    loading,
    error,
    refreshData,
    connectToGitHub,
    disconnectFromGitHub,
  };
};
