/**
 * GitHub Actions API Integration Service
 * Real-time workflow monitoring and pipeline management
 */

import {
  Pipeline,
  GitHubRepository,
  AWSDeploymentStatus,
} from "../../../shared/types/dashboard";

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
  private readonly baseUrl = "https://api.github.com";
  private readonly owner: string;
  private readonly repo: string;
  private readonly token?: string;

  constructor() {
    this.owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || "anandavicky123";
    this.repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "syncerticaenterprise";
    this.token = process.env.GITHUB_TOKEN;
  }

  private get headers() {
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Syncertica-Enterprise/1.0",
    };

    if (this.token) {
      headers["Authorization"] = `token ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: this.headers,
        cache: "no-store", // Always fetch fresh data
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "GitHub API rate limit exceeded. Please add GITHUB_TOKEN to increase limits."
          );
        }
        if (response.status === 404) {
          throw new Error("Repository not found or no access permissions.");
        }
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`GitHub API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all workflow runs for the repository
   */
  async getWorkflowRuns(limit: number = 20): Promise<GitHubWorkflowRun[]> {
    try {
      const data = await this.request<{ workflow_runs: GitHubWorkflowRun[] }>(
        `/actions/runs?per_page=${limit}&status=all`
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
      const data = await this.request<{ jobs: GitHubWorkflowJob[] }>(
        `/actions/runs/${runId}/jobs`
      );
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
      }>("");
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
      return {
        name: this.repo,
        full_name: `${this.owner}/${this.repo}`,
        description: "Unable to fetch repository information",
        private: false,
        html_url: `https://github.com/${this.owner}/${this.repo}`,
        clone_url: `https://github.com/${this.owner}/${this.repo}.git`,
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
    inputs: Record<string, string | number | boolean> = {}
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/actions/workflows/${workflowId}/dispatches`,
        {
          method: "POST",
          headers: {
            ...this.headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref,
            inputs,
          }),
        }
      );

      return response.ok;
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
    conclusion: string | null
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
          run.name.toLowerCase().includes("cd")
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
        (r) => r.status === "completed" && r.run_started_at
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
