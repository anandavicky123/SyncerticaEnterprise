/**
 * GitHub Actions API Integration Service
 * Real-time workflow monitoring and pipeline management
 */

import {
  Pipeline,
  GitHubRepository,
  AWSDeploymentStatus,
} from "../types/dashboard";
import { isDevelopment } from "../config/environment";

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  created_at: string;
  updated_at: string;
  run_started_at: string | null;
  workflow_id: number;
  head_branch: string;
  head_sha: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  triggering_actor: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  jobs_url: string;
  artifacts_url: string;
}

export interface GitHubWorkflowJob {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  started_at: string;
  completed_at: string | null;
  html_url: string;
  steps: Array<{
    name: string;
    status: "queued" | "in_progress" | "completed";
    conclusion:
      | "success"
      | "failure"
      | "neutral"
      | "cancelled"
      | "skipped"
      | "timed_out"
      | "action_required"
      | null;
    number: number;
    started_at: string | null;
    completed_at: string | null;
  }>;
}

class GitHubActionsService {
  private readonly baseUrl = "/api/github/workflows";

  constructor() {
    // No need for tokens or credentials on client side
    // All authentication is handled on the server side
    if (isDevelopment()) {
      console.log("🔧 GitHub Actions Service: Running in DEVELOPMENT mode");
      console.log("🌐 Using server-side API for GitHub integration");
    }
  }

  private async request<T>(
    action: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const searchParams = new URLSearchParams({ action, ...params });
    const url = `${this.baseUrl}?${searchParams}`;

    try {
      const response = await fetch(url, {
        cache: "no-store", // Always fetch fresh data
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            `API error: ${response.status} ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`GitHub API request failed for ${action}:`, error);
      throw error;
    }
  }

  /**
   * Get all workflow runs for the repository
   */
  async getWorkflowRuns(limit: number = 20): Promise<GitHubWorkflowRun[]> {
    try {
      const data = await this.request<{ workflow_runs: GitHubWorkflowRun[] }>(
        "runs",
        {
          limit: limit.toString(),
        },
      );
      return data.workflow_runs;
    } catch (error) {
      console.error("Failed to fetch workflow runs:", error);
      return [];
    }
  }

  /**
   * Get jobs for a specific workflow run
   */
  async getWorkflowRunJobs(runId: number): Promise<GitHubWorkflowJob[]> {
    try {
      const data = await this.request<{ jobs: GitHubWorkflowJob[] }>("jobs", {
        runId: runId.toString(),
      });
      return data.jobs;
    } catch (error) {
      console.error(`Failed to fetch jobs for run ${runId}:`, error);
      return [];
    }
  }

  /**
   * Get repository information
   */
  async getRepository(): Promise<GitHubRepository> {
    try {
      const repo = await this.request<{
        name: string;
        full_name: string;
        description: string;
        private: boolean;
        html_url: string;
        clone_url: string;
        default_branch: string;
        created_at: string;
        updated_at: string;
        stargazers_count: number;
        forks_count: number;
        language: string;
        topics: string[];
      }>("repository");

      return {
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        default_branch: repo.default_branch,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language,
        topics: repo.topics || [],
      };
    } catch (error) {
      console.error("Failed to fetch repository info:", error);

      // Return fallback data using environment variables
      const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || "anandavicky123";
      const repoName =
        process.env.NEXT_PUBLIC_GITHUB_REPO || "SyncerticaEnterprise";

      return {
        name: repoName,
        full_name: `${owner}/${repoName}`,
        description: "Unable to fetch repository information",
        private: false,
        html_url: `https://github.com/${owner}/${repoName}`,
        clone_url: `https://github.com/${owner}/${repoName}.git`,
        default_branch: "main",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stargazers_count: 0,
        forks_count: 0,
        language: "TypeScript",
        topics: [],
      };
    }
  }

  /**
   * Trigger a workflow
   */
  async triggerWorkflow(
    workflowId: string | number,
    ref: string = "main",
    inputs: Record<string, string | number | boolean> = {},
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?action=trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId,
          ref,
          inputs,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            `Failed to trigger workflow: ${response.statusText}`,
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to trigger workflow:", error);
      return false;
    }
  }

  /**
   * Convert GitHub workflow run to Pipeline format
   */
  private convertToPipeline(run: GitHubWorkflowRun): Pipeline {
    const status = this.convertStatus(run.status, run.conclusion);
    const startTime = run.run_started_at
      ? new Date(run.run_started_at)
      : new Date(run.created_at);
    const endTime =
      run.status === "completed" ? new Date(run.updated_at) : null;
    const duration = endTime ? endTime.getTime() - startTime.getTime() : null;

    return {
      id: run.id.toString(),
      name: run.name,
      status,
      branch: run.head_branch,
      commit: run.head_sha.substring(0, 7),
      author: run.actor.login,
      lastRun: startTime.toISOString(),
      duration: duration ? Math.round(duration / 1000) : 0, // Convert to seconds and default to 0 if null
      stages: [], // Will be populated by jobs if needed
    };
  }

  /**
   * Convert GitHub status to Pipeline status
   */
  private convertStatus(
    status: string,
    conclusion: string | null,
  ): Pipeline["status"] {
    if (status === "queued") return "pending";
    if (status === "in_progress") return "running";
    if (status === "completed") {
      switch (conclusion) {
        case "success":
          return "success";
        case "failure":
          return "failed";
        case "cancelled":
          return "failed"; // Map cancelled to failed
        default:
          return "failed";
      }
    }
    return "pending";
  }

  /**
   * Get pipelines (converted from workflow runs)
   */
  async getPipelines(): Promise<Pipeline[]> {
    const runs = await this.getWorkflowRuns(20);
    return runs.map((run) => this.convertToPipeline(run));
  }

  /**
   * Get AWS deployment status from latest workflow runs
   */
  async getAWSDeploymentStatus(): Promise<AWSDeploymentStatus> {
    try {
      const runs = await this.getWorkflowRuns(5);
      const deploymentRuns = runs.filter(
        (run) =>
          run.name.toLowerCase().includes("deploy") ||
          run.name.toLowerCase().includes("ci") ||
          run.name.toLowerCase().includes("cd"),
      );

      const latestRun = deploymentRuns[0];

      if (!latestRun) {
        return {
          ecr: { status: "unknown", lastUpdate: new Date() },
          ecs: { status: "unknown", lastUpdate: new Date() },
          terraform: { status: "unknown", lastUpdate: new Date() },
        };
      }

      const status = this.convertStatus(latestRun.status, latestRun.conclusion);
      const ecsStatus =
        status === "success"
          ? "running"
          : status === "running"
            ? "deploying"
            : "stopped";

      return {
        ecr: {
          status: status === "success" ? "available" : "building",
          lastUpdate: new Date(latestRun.updated_at),
        },
        ecs: {
          status: ecsStatus,
          lastUpdate: new Date(latestRun.updated_at),
        },
        terraform: {
          status: status === "success" ? "applied" : "planning",
          lastUpdate: new Date(latestRun.updated_at),
        },
      };
    } catch (error) {
      console.error("Failed to fetch AWS deployment status:", error);
      return {
        ecr: { status: "unknown", lastUpdate: new Date() },
        ecs: { status: "unknown", lastUpdate: new Date() },
        terraform: { status: "unknown", lastUpdate: new Date() },
      };
    }
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStatistics() {
    try {
      const runs = await this.getWorkflowRuns(50); // Get more data for better statistics

      const total = runs.length;
      const successful = runs.filter((r) => r.conclusion === "success").length;
      const failed = runs.filter((r) => r.conclusion === "failure").length;
      const running = runs.filter((r) => r.status === "in_progress").length;

      // Calculate average duration for completed runs
      const completedRuns = runs.filter(
        (r) => r.status === "completed" && r.run_started_at,
      );
      const totalDuration = completedRuns.reduce((sum, run) => {
        const start = new Date(run.run_started_at!).getTime();
        const end = new Date(run.updated_at).getTime();
        return sum + (end - start);
      }, 0);

      const averageDuration =
        completedRuns.length > 0 ? totalDuration / completedRuns.length : 0;

      return {
        total,
        successful,
        failed,
        running,
        successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
        averageDuration: Math.round(averageDuration / 1000), // Convert to seconds
      };
    } catch (error) {
      console.error("Failed to calculate pipeline statistics:", error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        running: 0,
        successRate: 0,
        averageDuration: 0,
      };
    }
  }
}

// Export singleton instance
export const githubActionsService = new GitHubActionsService();
export default githubActionsService;
