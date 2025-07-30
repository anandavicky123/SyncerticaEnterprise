/**
 * GitHub Actions API Integration for Syncertica Enterprise
 * Real-time workflow monitoring and AWS deployment status
 */

export interface GitHubWorkflow {
  id: number;
  name: string;
  state: "active" | "inactive";
  html_url: string;
  badge_url: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  head_branch: string;
  head_sha: string;
  event: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  run_number: number;
  workflow_id: number;
  jobs?: GitHubJob[];
}

export interface GitHubJob {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  started_at: string;
  completed_at: string;
  html_url: string;
  steps?: GitHubStep[];
}

export interface GitHubStep {
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  number: number;
  started_at: string;
  completed_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  language: string;
  size: number;
  default_branch: string;
  updated_at: string;
}

class GitHubActionsService {
  private baseUrl = "/api/github/workflows";

  constructor() {
    // No need for tokens or credentials on client side
  }

  private async request<T>(
    action: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const searchParams = new URLSearchParams({ action, ...params });

    const response = await fetch(`${this.baseUrl}?${searchParams}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error ||
          `API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get all workflows for the repository
   */
  async getWorkflows(): Promise<GitHubWorkflow[]> {
    try {
      const data = await this.request<{ workflows: GitHubWorkflow[] }>(
        "workflows"
      );
      return data.workflows;
    } catch (error) {
      console.error("Error fetching workflows:", error);
      return [];
    }
  }

  /**
   * Get workflow runs for a specific workflow or all workflows
   */
  async getWorkflowRuns(
    workflowId?: number,
    limit = 10
  ): Promise<GitHubWorkflowRun[]> {
    try {
      const params: Record<string, string> = { limit: limit.toString() };
      if (workflowId) {
        params.workflowId = workflowId.toString();
      }

      const data = await this.request<{ workflow_runs: GitHubWorkflowRun[] }>(
        "runs",
        params
      );
      return data.workflow_runs;
    } catch (error) {
      console.error("Error fetching workflow runs:", error);
      return [];
    }
  }

  /**
   * Get jobs for a specific workflow run
   */
  async getWorkflowRunJobs(runId: number): Promise<GitHubJob[]> {
    try {
      const data = await this.request<{ jobs: GitHubJob[] }>("jobs", {
        runId: runId.toString(),
      });
      return data.jobs;
    } catch (error) {
      console.error("Error fetching workflow run jobs:", error);
      return [];
    }
  }

  /**
   * Get repository information
   */
  async getRepository(): Promise<GitHubRepository | null> {
    try {
      return await this.request<GitHubRepository>("repository");
    } catch (error) {
      console.error("Error fetching repository:", error);
      return null;
    }
  }

  /**
   * Trigger a workflow dispatch event
   */
  async triggerWorkflow(
    workflowId: number,
    ref = "main",
    inputs = {}
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?action=trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflowId, ref, inputs }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error ||
            `Failed to trigger workflow: ${response.statusText}`
        );
      }

      return true;
    } catch (error) {
      console.error("Error triggering workflow:", error);
      return false;
    }
  }

  /**
   * Get deployment status from AWS
   */
  async getAWSDeploymentStatus(): Promise<
    {
      environment: string;
      status: "deploying" | "deployed" | "failed";
      lastDeployment: string;
      version: string;
    }[]
  > {
    // This would integrate with AWS APIs to get actual deployment status
    // For now, return simulated data
    return [
      {
        environment: "staging",
        status: "deployed",
        lastDeployment: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        version: "v1.2.3",
      },
      {
        environment: "production",
        status: "deployed",
        lastDeployment: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        version: "v1.2.2",
      },
    ];
  }

  /**
   * Convert GitHub status to our internal status format
   */
  convertStatus(
    status: string,
    conclusion: string | null
  ): "success" | "failed" | "running" | "pending" | "skipped" {
    if (status === "queued") return "pending";
    if (status === "in_progress") return "running";
    if (status === "completed") {
      switch (conclusion) {
        case "success":
          return "success";
        case "failure":
          return "failed";
        case "cancelled":
          return "skipped";
        case "skipped":
          return "skipped";
        default:
          return "failed";
      }
    }
    return "pending";
  }

  /**
   * Format duration between two dates
   */
  formatDuration(startDate: string, endDate?: string): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins}m ${secs}s`;
  }

  /**
   * Get workflow run logs URL
   */
  getLogsUrl(runId: number): string {
    const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || "anandavicky123";
    const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "SyncerticaEnterprise";
    return `https://github.com/${owner}/${repo}/actions/runs/${runId}`;
  }

  /**
   * Get artifact download URL
   */
  async getArtifacts(runId: number): Promise<
    Array<{
      id: number;
      name: string;
      size_in_bytes: number;
      url: string;
      archive_download_url: string;
    }>
  > {
    try {
      // For now, return empty array since we don't have artifacts endpoint in our API
      // You can extend the API route to handle artifacts if needed
      console.warn(
        `Artifacts endpoint not implemented in API route for run ${runId}`
      );
      return [];
    } catch (error) {
      console.error("Error fetching artifacts:", error);
      return [];
    }
  }
}

export const githubActionsService = new GitHubActionsService();
