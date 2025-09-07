import { useState, useEffect, useCallback, useMemo } from "react";

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
  provider: "github" | "gitlab" | "bitbucket";
}

interface GitHubRepository {
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

interface GitLabRepository {
  id: string;
  name: string;
  path_with_namespace: string;
  description: string;
  visibility: string;
  web_url: string;
  http_url_to_repo: string;
  ssh_url_to_repo: string;
  default_branch: string;
  languages?: Record<string, number>;
  star_count: number;
  forks_count: number;
  last_activity_at: string;
}

interface BitbucketRepository {
  uuid: string;
  name: string;
  full_name: string;
  description: string;
  is_private: boolean;
  links: {
    html: { href: string };
    clone: Array<{ name: string; href: string }>;
  };
  mainbranch?: { name: string };
  language: string;
  updated_on: string;
}

interface WorkflowResponse {
  id: string | number;
  name: string;
  filename?: string;
  path?: string;
  state?: string;
  status?: string;
  conclusion?: string;
  html_url?: string;
  url?: string;
  latest_status?: string;
  latest_conclusion?: string;
  updated_at?: string;
}

interface InfrastructureResponse {
  id: string;
  name: string;
  type: string;
  path: string;
  content: string;
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
  provider: "github" | "gitlab" | "bitbucket";
  repository: string;
}

export interface Infrastructure {
  id: string;
  name: string;
  type: string;
  path: string;
  content: string;
  provider: "github" | "gitlab" | "bitbucket";
  repository: string;
}

export interface ConnectionStatus {
  github: boolean;
  gitlab: boolean;
  bitbucket: boolean;
}

export interface Statistics {
  totalRepositories: number;
  totalWorkflows: number;
  totalInfrastructure: number;
  successRate: number;
  monthlyCost: number;
}

export const useMultiProviderData = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [infrastructure, setInfrastructure] = useState<Infrastructure[]>([]);
  const [loading, setLoading] = useState(false);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [workflowsLoading, setWorkflowsLoading] = useState(false);
  const [infrastructureLoading, setInfrastructureLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<ConnectionStatus>({
    github: false,
    gitlab: false,
    bitbucket: false,
  });
  const [statistics, setStatistics] = useState<Statistics>({
    totalRepositories: 0,
    totalWorkflows: 0,
    totalInfrastructure: 0,
    successRate: 0,
    monthlyCost: 0,
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasLoadedRepositories, setHasLoadedRepositories] = useState(false);
  const [hasLoadedWorkflows, setHasLoadedWorkflows] = useState(false);
  const [hasLoadedInfrastructure, setHasLoadedInfrastructure] = useState(false);

  // Cache management with fast connection state
  const CACHE_KEYS = useMemo(
    () => ({
      repositories: "multiProvider_repositories",
      workflows: "multiProvider_workflows",
      infrastructure: "multiProvider_infrastructure",
      connections: "multiProvider_connections",
      timestamp: "multiProvider_timestamp",
      lastKnownConnections: "multiProvider_lastKnownConnections", // For faster startup
    }),
    []
  );

  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Helper functions for cache management
  const getCachedData = useCallback((key: string): unknown => {
    try {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Error reading cache for ${key}:`, error);
      return null;
    }
  }, []);

  const setCachedData = useCallback(
    (key: string, data: unknown) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(CACHE_KEYS.timestamp, Date.now().toString());
      } catch (error) {
        console.error(`Error setting cache for ${key}:`, error);
      }
    },
    [CACHE_KEYS.timestamp]
  );

  const isCacheValid = useCallback(() => {
    const timestamp = localStorage.getItem(CACHE_KEYS.timestamp);
    if (!timestamp) return false;
    const age = Date.now() - parseInt(timestamp);
    return age < CACHE_DURATION;
  }, [CACHE_KEYS.timestamp, CACHE_DURATION]);

  const clearCache = useCallback(() => {
    console.log("🗑️ Clearing provider data cache...");
    Object.values(CACHE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }, [CACHE_KEYS]);

  // Save connection state for fast future startups
  const saveLastKnownConnections = useCallback(
    (connections: ConnectionStatus) => {
      setCachedData(CACHE_KEYS.lastKnownConnections, connections);
    },
    [setCachedData, CACHE_KEYS.lastKnownConnections]
  );

  // Load data from cache if available and valid - now supports partial cache loading
  const loadFromCache = useCallback(() => {
    if (!isCacheValid()) {
      console.log("📅 Cache expired, will fetch fresh data");
      return false;
    }

    console.log("📦 Loading data from cache...");

    const cachedRepos = getCachedData(CACHE_KEYS.repositories) as
      | Repository[]
      | null;
    const cachedWorkflows = getCachedData(CACHE_KEYS.workflows) as
      | Workflow[]
      | null;
    const cachedInfrastructure = getCachedData(CACHE_KEYS.infrastructure) as
      | Infrastructure[]
      | null;
    const cachedConnections = getCachedData(
      CACHE_KEYS.connections
    ) as ConnectionStatus | null;

    let hasAnyCache = false;

    // Load cached connections first for immediate provider recognition
    if (cachedConnections) {
      setConnected(cachedConnections);
      hasAnyCache = true;
      console.log("🔗 Loaded connection status from cache");
    }

    // Load repositories if available - this is the most important for initial display
    if (cachedRepos) {
      setRepositories(cachedRepos);
      setHasLoadedRepositories(true);
      hasAnyCache = true;
      console.log("📚 Loaded repositories from cache");
    }

    // Load workflows if available
    if (cachedWorkflows) {
      setWorkflows(cachedWorkflows);
      setHasLoadedWorkflows(true);
      console.log("⚙️ Loaded workflows from cache");
    }

    // Load infrastructure if available
    if (cachedInfrastructure) {
      setInfrastructure(cachedInfrastructure);
      setHasLoadedInfrastructure(true);
      console.log("🏗️ Loaded infrastructure from cache");
    }

    if (hasAnyCache) {
      console.log("✅ Successfully loaded partial/full data from cache");
      return true;
    }

    return false;
  }, [CACHE_KEYS, isCacheValid, getCachedData]);

  // Save data to cache
  const saveToCache = useCallback(
    (
      repos: Repository[],
      wflows: Workflow[],
      infra: Infrastructure[],
      conn: ConnectionStatus
    ) => {
      console.log("💾 Saving data to cache...");
      setCachedData(CACHE_KEYS.repositories, repos);
      setCachedData(CACHE_KEYS.workflows, wflows);
      setCachedData(CACHE_KEYS.infrastructure, infra);
      setCachedData(CACHE_KEYS.connections, conn);
    },
    [CACHE_KEYS, setCachedData]
  );

  // Fast fetch with timeout helper - different timeouts for different API types
  const fetchWithTimeout = useCallback((url: string, timeout?: number) => {
    // Default timeouts based on API type
    let defaultTimeout = 15000; // 15 seconds for data APIs (repositories, workflows, infrastructure)
    
    if (url.includes('/status/')) {
      defaultTimeout = 3000; // 3 seconds for status checks
    }
    
    const actualTimeout = timeout || defaultTimeout;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout for ${url}`)), actualTimeout)
    );
    return Promise.race([fetch(url), timeoutPromise]);
  }, []);

  // Check connection status for all providers - FAST and reliable
  const checkConnections = useCallback(async () => {
    console.log("🔍 FAST connection check starting...");
    try {
      const connectionPromises = [
        fetchWithTimeout("/api/status/github_status", 3000), // 3 second timeout for status
        fetchWithTimeout("/api/status/gitlab_status", 3000),
        fetchWithTimeout("/api/status/bitbucket_status", 3000),
      ];

      const [githubRes, gitlabRes, bitbucketRes] = await Promise.allSettled(
        connectionPromises
      );

      const parseJsonSafely = async (
        response: PromiseSettledResult<unknown>
      ) => {
        try {
          if (
            response.status === "fulfilled" &&
            response.value &&
            typeof response.value === "object" &&
            "ok" in response.value &&
            (response.value as Response).ok
          ) {
            const responseText = await (response.value as Response).text();
            return JSON.parse(responseText);
          }
          return { connected: false };
        } catch (error) {
          console.error("Failed to parse JSON response:", error);
          return { connected: false };
        }
      };

      const [githubData, gitlabData, bitbucketData] = await Promise.all([
        parseJsonSafely(githubRes),
        parseJsonSafely(gitlabRes),
        parseJsonSafely(bitbucketRes),
      ]);

      console.log("📊 Connection status:", {
        github: githubData.connected,
        gitlab: gitlabData.connected,
        bitbucket: bitbucketData.connected,
      });

      const newConnectionState = {
        github: githubData.connected,
        gitlab: gitlabData.connected,
        bitbucket: bitbucketData.connected,
      };

      setConnected(newConnectionState);
      // Save for fast future startups
      saveLastKnownConnections(newConnectionState);
    } catch (error) {
      console.error("💥 Error checking connections:", error);
      // On error, maintain any cached connection state if available
    }
  }, [saveLastKnownConnections, fetchWithTimeout]);

  // Fetch repositories from all connected providers with gradual loading
  const fetchRepositories = useCallback(
    async (forceRefresh = false) => {
      if (hasLoadedRepositories && !forceRefresh) return; // Prevent duplicate loading

      setRepositoriesLoading(true);
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      try {
        // Track provider counts for statistics
        const providerCounts = { github: 0, gitlab: 0, bitbucket: 0 };

        // Fetch GitHub repositories
        if (connected.github) {
          try {
            const response = (await fetchWithTimeout(
              "/api/repositories/github_repositories"
            )) as Response;
            if (response.ok) {
              const githubRepos: GitHubRepository[] = await response.json();
              const transformedRepos = githubRepos.map(
                (repo: GitHubRepository) => ({
                  ...repo,
                  provider: "github" as const,
                })
              );

              providerCounts.github = transformedRepos.length;

              // Update repositories immediately as they arrive
              setRepositories((prev) => {
                // Filter out existing GitHub repos to avoid duplicates
                const filtered = prev.filter(
                  (repo) => repo.provider !== "github"
                );
                return [...filtered, ...transformedRepos];
              });
            }
          } catch (error) {
            console.error("Error fetching GitHub repositories:", error);
          }
        }

        // Fetch GitLab repositories
        if (connected.gitlab) {
          console.log("🚀 Fetching GitLab repositories from hook...");
          try {
            const response = (await fetchWithTimeout(
              "/api/repositories/gitlab_repositories"
            )) as Response;
            console.log(
              "📡 GitLab repositories response status:",
              response.status
            );
            if (response.ok) {
              const gitlabRepos: GitLabRepository[] = await response.json();
              console.log("✅ GitLab repos received:", gitlabRepos.length);
              console.log(
                "📋 First GitLab repo structure:",
                JSON.stringify(gitlabRepos[0], null, 2)
              );

              const transformedRepos = gitlabRepos.map(
                (repo: GitLabRepository) => {
                  console.log(`🔄 Transforming GitLab repo: ${repo.name}`);
                  return {
                    id: repo.id,
                    name: repo.name,
                    full_name: repo.path_with_namespace,
                    description: repo.description,
                    private: repo.visibility === "private",
                    html_url: repo.web_url,
                    clone_url: repo.http_url_to_repo,
                    ssh_url: repo.ssh_url_to_repo,
                    default_branch: repo.default_branch,
                    language: Object.keys(repo.languages || {})[0] || "Unknown",
                    stargazers_count: repo.star_count,
                    forks_count: repo.forks_count,
                    updated_at: repo.last_activity_at,
                    provider: "gitlab" as const,
                  };
                }
              );

              console.log(
                "✅ Transformed GitLab repos:",
                transformedRepos.length
              );

              providerCounts.gitlab = transformedRepos.length;

              // Update repositories immediately as they arrive
              setRepositories((prev) => {
                // Filter out existing GitLab repos to avoid duplicates
                const filtered = prev.filter(
                  (repo) => repo.provider !== "gitlab"
                );
                return [...filtered, ...transformedRepos];
              });
            } else {
              const errorText = await response.text();
              console.log(
                "❌ GitLab repositories fetch failed:",
                response.status,
                errorText
              );
            }
          } catch (error) {
            console.error("💥 Error fetching GitLab repositories:", error);
          }
        } else {
          console.log("⚠️ GitLab not connected, skipping repository fetch");
        }

        // Fetch Bitbucket repositories
        if (connected.bitbucket) {
          try {
            const response = (await fetchWithTimeout(
              "/api/repositories/bitbucket_repositories"
            )) as Response;
            if (response.ok) {
              const bitbucketRepos: BitbucketRepository[] =
                await response.json();
              const transformedRepos = bitbucketRepos.map(
                (repo: BitbucketRepository) => ({
                  id: repo.uuid,
                  name: repo.name,
                  full_name: repo.full_name,
                  description: repo.description,
                  private: repo.is_private,
                  html_url: repo.links.html.href,
                  clone_url:
                    repo.links.clone.find((link) => link.name === "https")
                      ?.href || "",
                  ssh_url:
                    repo.links.clone.find((link) => link.name === "ssh")
                      ?.href || "",
                  default_branch: repo.mainbranch?.name || "main",
                  language: repo.language,
                  stargazers_count: 0, // Bitbucket doesn't provide stars
                  forks_count: 0, // Would need separate API call
                  updated_at: repo.updated_on,
                  provider: "bitbucket" as const,
                })
              );

              providerCounts.bitbucket = transformedRepos.length;

              // Update repositories immediately as they arrive
              setRepositories((prev) => {
                // Filter out existing Bitbucket repos to avoid duplicates
                const filtered = prev.filter(
                  (repo) => repo.provider !== "bitbucket"
                );
                return [...filtered, ...transformedRepos];
              });
            }
          } catch (error) {
            console.error("Error fetching Bitbucket repositories:", error);
          }
        }

        const totalRepos =
          providerCounts.github +
          providerCounts.gitlab +
          providerCounts.bitbucket;
        console.log("📊 Final repository count:", totalRepos);
        console.log("📊 Repositories by provider:", providerCounts);

        // Repositories are already set via gradual loading above
        setHasLoadedRepositories(true);
      } catch (error) {
        console.error("Error fetching repositories:", error);
        setError("Failed to fetch repositories");
      } finally {
        setRepositoriesLoading(false);
        if (isInitialLoad) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    },
    [connected, isInitialLoad, hasLoadedRepositories, fetchWithTimeout]
  );

  // Fetch workflows from all connected providers
  const fetchWorkflows = useCallback(
    async (repoList?: Repository[]) => {
      if (hasLoadedWorkflows) return; // Prevent duplicate loading

      const reposToUse = repoList || repositories;
      if (reposToUse.length === 0) return;

      setWorkflowsLoading(true);
      try {
        const allWorkflows: Workflow[] = [];

        // Fetch workflows in parallel for all repositories
        const workflowPromises = reposToUse.map(async (repo) => {
          const endpoint = `/workflows/${
            repo.provider
          }_workflows?repo=${encodeURIComponent(repo.full_name)}`;

          try {
            console.log(
              `🔍 Fetching workflows for ${repo.full_name} (${repo.provider})`
            );
            const response = await fetch(`/api${endpoint}`);
            console.log(
              `📡 Workflow API response for ${repo.full_name}:`,
              response.status
            );

            if (response.ok) {
              const repoWorkflows: WorkflowResponse[] = await response.json();
              console.log(
                `📋 Raw workflows received for ${repo.full_name}:`,
                repoWorkflows.length
              );

              if (repoWorkflows.length > 0) {
                console.log(`🔍 First workflow data:`, repoWorkflows[0]);
              }

              const transformed = repoWorkflows.map(
                (workflow: WorkflowResponse) => ({
                  id: workflow.id.toString(),
                  name: workflow.name || "Workflow",
                  filename: workflow.path
                    ? workflow.path.split("/").pop() || "workflow.yml"
                    : workflow.filename || "workflow.yml",
                  path: workflow.path || workflow.filename || "",
                  state: workflow.state || "active",
                  status:
                    workflow.latest_status || workflow.status || "unknown",
                  conclusion:
                    workflow.latest_conclusion ||
                    workflow.conclusion ||
                    "unknown",
                  html_url: workflow.url || workflow.html_url || "",
                  provider: repo.provider,
                  repository: repo.full_name,
                  updated_at: workflow.updated_at || new Date().toISOString(),
                })
              );

              console.log(
                `✅ Transformed workflows for ${repo.full_name}:`,
                transformed.length
              );
              return transformed;
            } else {
              console.log(
                `❌ Workflow API failed for ${repo.full_name}:`,
                response.status
              );
            }
          } catch (error) {
            console.error(
              `Error fetching workflows for ${repo.full_name}:`,
              error
            );
          }
          return [];
        });

        const workflowResults = await Promise.all(workflowPromises);
        console.log("🔍 Workflow results received:", workflowResults.length);

        workflowResults.forEach((workflows, index) => {
          if (workflows) {
            console.log(`📋 Repository ${index} workflows:`, workflows.length);
            allWorkflows.push(...workflows);
          }
        });

        console.log("✅ Total workflows found:", allWorkflows.length);
        console.log("🔍 Workflows by provider:", {
          github: allWorkflows.filter((w) => w.provider === "github").length,
          gitlab: allWorkflows.filter((w) => w.provider === "gitlab").length,
          bitbucket: allWorkflows.filter((w) => w.provider === "bitbucket")
            .length,
        });
        console.log("📋 Sample workflow data:", allWorkflows.slice(0, 3));
        setWorkflows(allWorkflows);
        setHasLoadedWorkflows(true);
      } catch (error) {
        console.error("Error fetching workflows:", error);
      } finally {
        setWorkflowsLoading(false);
      }
    },
    [repositories, hasLoadedWorkflows]
  );

  // Fetch infrastructure from all connected providers
  const fetchInfrastructure = useCallback(
    async (repoList?: Repository[]) => {
      if (hasLoadedInfrastructure) return; // Prevent duplicate loading

      const reposToUse = repoList || repositories;
      if (reposToUse.length === 0) return;

      setInfrastructureLoading(true);
      try {
        const allInfrastructure: Infrastructure[] = [];

        // Fetch infrastructure in parallel for all repositories
        const infraPromises = reposToUse.map(async (repo) => {
          const endpoint = `/infrastructure/${
            repo.provider
          }_infrastructure?repo=${encodeURIComponent(repo.full_name)}`;

          try {
            const response = await fetch(`/api${endpoint}`);
            if (response.ok) {
              const repoInfrastructure: InfrastructureResponse[] =
                await response.json();
              return repoInfrastructure.map(
                (infra: InfrastructureResponse) => ({
                  ...infra,
                  provider: repo.provider,
                  repository: repo.full_name,
                })
              );
            }
          } catch (error) {
            console.error(
              `Error fetching infrastructure for ${repo.full_name}:`,
              error
            );
          }
          return [];
        });

        const infraResults = await Promise.all(infraPromises);
        infraResults.forEach((infrastructure) => {
          if (infrastructure) {
            allInfrastructure.push(...infrastructure);
          }
        });

        setInfrastructure(allInfrastructure);
        setHasLoadedInfrastructure(true);
      } catch (error) {
        console.error("Error fetching infrastructure:", error);
      } finally {
        setInfrastructureLoading(false);
      }
    },
    [repositories, hasLoadedInfrastructure]
  );

  // Calculate statistics
  useEffect(() => {
    // Always calculate statistics when any data changes
    const successfulWorkflows = workflows.filter(
      (w) => w.conclusion === "success"
    ).length;
    const successRate =
      workflows.length > 0 ? (successfulWorkflows / workflows.length) * 100 : 0;

    setStatistics({
      totalRepositories: repositories.length,
      totalWorkflows: workflows.length,
      totalInfrastructure: infrastructure.length,
      successRate: Math.round(successRate),
      monthlyCost: Math.round(
        repositories.length * 5.99 + infrastructure.length * 12.5
      ),
    });
  }, [repositories, workflows, infrastructure]);

  // Refresh all data (clears cache and forces fresh fetch)
  const refreshData = useCallback(async () => {
    console.log("🔄 Manual refresh triggered - clearing cache");
    clearCache();
    setLoading(true);
    setHasLoadedRepositories(false);
    setHasLoadedWorkflows(false);
    setHasLoadedInfrastructure(false);
    await checkConnections();
    await fetchRepositories(true); // Force refresh
  }, [checkConnections, fetchRepositories, clearCache]);

  // Simplified and reliable initial loading - fix the "no loading" issue
  useEffect(() => {
    if (isInitialLoad) {
      console.log("🚀 SIMPLE Initial load starting...");
      console.log("🔍 Current state:", {
        isInitialLoad,
        hasLoadedRepositories,
        repositoriesLoading,
      });
      setIsInitialLoad(false);

      // Try cache first
      const cacheLoaded = loadFromCache();

      if (cacheLoaded) {
        console.log("✅ Cache loaded successfully");
        // Always do a background connection check even with cache
        setTimeout(() => {
          checkConnections().catch(console.error);
        }, 100); // Very short delay
      } else {
        console.log(
          "❌ No cache found - starting connection check immediately"
        );
        // No cache, must check connections
        checkConnections().catch((error) => {
          console.error("Connection check failed:", error);
          // Even if connection check fails, try to load with default state
          setConnected({ github: false, gitlab: false, bitbucket: false });
        });
      }
    }
  }, [
    isInitialLoad,
    loadFromCache,
    checkConnections,
    hasLoadedRepositories,
    repositoriesLoading,
  ]);

  // Simplified data loading - start fetching as soon as connections are available
  useEffect(() => {
    console.log("🔍 Connection state changed:", connected);

    if (connected.github || connected.gitlab || connected.bitbucket) {
      if (!hasLoadedRepositories) {
        console.log(
          "🏃‍♂️ Connections available - fetching repositories immediately"
        );
        fetchRepositories().catch((error) => {
          console.error("Repository fetch failed:", error);
          setRepositoriesLoading(false);
        });
      }
    } else {
      // Only clear data if we're sure we have no connections AND it's not the initial load
      if (!isInitialLoad) {
        console.log("🧹 No connections - clearing data");
        setRepositories([]);
        setWorkflows([]);
        setInfrastructure([]);
        setRepositoriesLoading(false);
        setWorkflowsLoading(false);
        setInfrastructureLoading(false);
        setHasLoadedRepositories(false);
        setHasLoadedWorkflows(false);
        setHasLoadedInfrastructure(false);
      }
    }
  }, [connected, fetchRepositories, hasLoadedRepositories, isInitialLoad]);

  // Fallback effect - ensure we always try to load data even if other effects fail
  useEffect(() => {
    // If after 2 seconds we still haven't started loading and we're not in initial load
    const fallbackTimer = setTimeout(() => {
      if (!isInitialLoad && !hasLoadedRepositories && !repositoriesLoading) {
        console.log(
          "⚠️ FALLBACK: No data loaded after timeout, forcing connection check"
        );
        checkConnections().catch(console.error);
      }
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, [
    isInitialLoad,
    hasLoadedRepositories,
    repositoriesLoading,
    checkConnections,
  ]);

  // Load workflows and infrastructure after repositories are loaded (restore original behavior)
  useEffect(() => {
    if (repositories.length > 0 && !repositoriesLoading) {
      // Start loading of workflows and infrastructure automatically
      if (!hasLoadedWorkflows) {
        fetchWorkflows(repositories);
      }
      if (!hasLoadedInfrastructure) {
        fetchInfrastructure(repositories);
      }
    }
  }, [
    repositories,
    repositoriesLoading,
    hasLoadedWorkflows,
    hasLoadedInfrastructure,
    fetchWorkflows,
    fetchInfrastructure,
  ]);

  // Save to cache when all data is loaded
  useEffect(() => {
    if (
      hasLoadedRepositories &&
      hasLoadedWorkflows &&
      hasLoadedInfrastructure &&
      repositories.length > 0 &&
      !loading &&
      !repositoriesLoading &&
      !workflowsLoading &&
      !infrastructureLoading
    ) {
      console.log("💾 All data loaded, saving to cache");
      saveToCache(repositories, workflows, infrastructure, connected);
    }
  }, [
    hasLoadedRepositories,
    hasLoadedWorkflows,
    hasLoadedInfrastructure,
    repositories,
    workflows,
    infrastructure,
    connected,
    loading,
    repositoriesLoading,
    workflowsLoading,
    infrastructureLoading,
    saveToCache,
  ]);

  return {
    repositories,
    workflows,
    infrastructure,
    loading,
    repositoriesLoading,
    workflowsLoading,
    infrastructureLoading,
    isInitialLoad,
    error,
    connected,
    statistics,
    refreshData,
    checkConnections,
    clearCache, // Export cache clearing function
  };
};
