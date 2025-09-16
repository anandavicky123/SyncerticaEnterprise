/**
 * React Hook for GitHub Actions Integration
 * Real-time pipeline data management and state handling
 */

import { useState, useEffect, useCallback } from "react";
import { Pipeline, AWSDeploymentStatus } from "../shared/types/dashboard";
import { githubActionsService } from "../shared/services/githubActionsService";

interface GitHubRepository {
  name: string;
  description: string;
  url: string;
  language: string;
  size: string;
  branch: string;
}

interface GitHubActionsState {
  pipelines: Pipeline[];
  repository: GitHubRepository | null;
  deployments: Array<{
    service: string;
    status: string;
    environment: string;
    lastDeployed: string;
    lastDeployment: string;
    version: string;
  }>;
  awsDeploymentStatus: AWSDeploymentStatus;
  statistics: {
    total: number;
    successful: number;
    failed: number;
    running: number;
    successRate: number;
    avgDuration: number;
  };
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseGitHubActionsReturn extends GitHubActionsState {
  refreshData: () => Promise<void>;
  triggerWorkflow: (
    workflowId: string | number,
    ref?: string
  ) => Promise<boolean>;
}

/**
 * Custom hook for managing GitHub Actions data and real-time updates
 */
export function useGitHubActions(): UseGitHubActionsReturn {
  const [state, setState] = useState<GitHubActionsState>({
    pipelines: [],
    repository: null,
    deployments: [],
    awsDeploymentStatus: {
      ecr: { status: "unknown", lastUpdate: new Date() },
      ecs: { status: "unknown", lastUpdate: new Date() },
      terraform: { status: "unknown", lastUpdate: new Date() },
    },
    statistics: {
      total: 0,
      successful: 0,
      failed: 0,
      running: 0,
      successRate: 0,
      avgDuration: 0,
    },
    loading: true,
    error: null,
    lastUpdated: null,
  });

  /**
   * Fetch all GitHub Actions data
   */
  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch data in parallel for better performance
      const [pipelines, repoData, awsStatus, stats] = await Promise.all([
        githubActionsService.getPipelines(),
        githubActionsService.getRepository(),
        githubActionsService.getAWSDeploymentStatus(),
        githubActionsService.getPipelineStatistics(),
      ]);

      // Convert repository data
      const repository: GitHubRepository = {
        name: repoData.name,
        description: repoData.description || "No description available",
        url: repoData.html_url,
        language: repoData.language || "Unknown",
        size: `${repoData.stargazers_count} stars`,
        branch: repoData.default_branch,
      };

      // Convert AWS deployment status to deployments array
      const deployments = [
        {
          service: "ECR Registry",
          status:
            awsStatus.ecr.status === "available"
              ? "deployed"
              : awsStatus.ecr.status === "building"
              ? "deploying"
              : "failed",
          environment: "Production",
          lastDeployed: awsStatus.ecr.lastUpdate.toISOString(),
          lastDeployment: awsStatus.ecr.lastUpdate.toISOString(),
          version: "latest",
        },
        {
          service: "ECS Service",
          status:
            awsStatus.ecs.status === "running"
              ? "deployed"
              : awsStatus.ecs.status === "deploying"
              ? "deploying"
              : "failed",
          environment: "Production",
          lastDeployed: awsStatus.ecs.lastUpdate.toISOString(),
          lastDeployment: awsStatus.ecs.lastUpdate.toISOString(),
          version: "v1.0.0",
        },
        {
          service: "Terraform",
          status:
            awsStatus.terraform.status === "applied"
              ? "deployed"
              : awsStatus.terraform.status === "planning"
              ? "deploying"
              : "failed",
          environment: "Infrastructure",
          lastDeployed: awsStatus.terraform.lastUpdate.toISOString(),
          lastDeployment: awsStatus.terraform.lastUpdate.toISOString(),
          version: "latest",
        },
      ];

      setState((prev) => ({
        ...prev,
        pipelines,
        repository,
        deployments,
        awsDeploymentStatus: awsStatus,
        statistics: {
          total: stats.total,
          successful: stats.successful,
          failed: stats.failed,
          running: stats.running,
          successRate: stats.successRate,
          avgDuration: stats.averageDuration,
        },
        loading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error("Failed to fetch GitHub Actions data:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch data",
      }));
    }
  }, []);

  /**
   * Refresh data manually
   */
  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * Trigger a workflow
   */
  const triggerWorkflow = useCallback(
    async (
      workflowId: string | number,
      ref: string = "main"
    ): Promise<boolean> => {
      try {
        const success = await githubActionsService.triggerWorkflow(
          workflowId,
          ref
        );
        if (success) {
          // Refresh data after triggering workflow
          setTimeout(() => {
            fetchData();
          }, 2000); // Wait 2 seconds for GitHub to register the new run
        }
        return success;
      } catch (error) {
        console.error("Failed to trigger workflow:", error);
        return false;
      }
    },
    [fetchData]
  );

  /**
   * Set up real-time updates
   */
  useEffect(() => {
    // Initial data fetch
    fetchData();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Update every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [fetchData]);

  /**
   * Additional effect for focus-based updates
   */
  useEffect(() => {
    const handleFocus = () => {
      // Refresh data when window gains focus
      fetchData();
    };

    const handleVisibilityChange = () => {
      // Refresh data when tab becomes visible
      if (!document.hidden) {
        fetchData();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData]);

  return {
    ...state,
    refreshData,
    triggerWorkflow,
  };
}

export default useGitHubActions;
