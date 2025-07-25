"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  Code,
  Package,
  Rocket,
  AlertTriangle,
  Download,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Pipeline, Repository } from "../../../shared/types/dashboard";

interface DevOpsPipelineProps {
  className?: string;
}

const DevOpsPipeline: React.FC<DevOpsPipelineProps> = ({ className = "" }) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    {
      id: "pipeline-1",
      name: "syncertica-enterprise-main",
      status: "success",
      lastRun: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      duration: 234,
      branch: "main",
      commit: "a1b2c3d",
      author: "John Admin",
      stages: [
        {
          id: "source",
          name: "Source",
          status: "success",
          duration: 12,
          logs: [
            "✓ Code retrieved from AWS CodeCommit",
            "✓ Webhook triggered successfully",
          ],
        },
        {
          id: "build",
          name: "Build",
          status: "success",
          duration: 156,
          logs: [
            "✓ Installing dependencies...",
            "✓ npm install completed",
            "✓ TypeScript compilation successful",
            "✓ Next.js build completed",
            "✓ Tests passed: 47/47",
          ],
          artifacts: ["build-artifacts.zip", "test-results.xml"],
        },
        {
          id: "test",
          name: "Test",
          status: "success",
          duration: 45,
          logs: [
            "✓ Unit tests: 32 passed",
            "✓ Integration tests: 15 passed",
            "✓ Coverage: 87%",
          ],
        },
        {
          id: "deploy",
          name: "Deploy",
          status: "success",
          duration: 21,
          logs: [
            "✓ Deploying to AWS ECS...",
            "✓ Container image pushed to ECR",
            "✓ ECS service updated",
            "✓ Health checks passed",
          ],
        },
      ],
    },
    {
      id: "pipeline-2",
      name: "syncertica-enterprise-dev",
      status: "running",
      lastRun: new Date().toISOString(),
      duration: 0,
      branch: "feature/ai-assistant",
      commit: "f4e5d6c",
      author: "Jane Employee",
      stages: [
        {
          id: "source",
          name: "Source",
          status: "success",
          duration: 8,
        },
        {
          id: "build",
          name: "Build",
          status: "running",
          duration: 0,
        },
        {
          id: "test",
          name: "Test",
          status: "pending",
        },
        {
          id: "deploy",
          name: "Deploy",
          status: "pending",
        },
      ],
    },
    {
      id: "pipeline-3",
      name: "syncertica-enterprise-hotfix",
      status: "failed",
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      duration: 89,
      branch: "hotfix/security-patch",
      commit: "c7d8e9f",
      author: "Mike Manager",
      stages: [
        {
          id: "source",
          name: "Source",
          status: "success",
          duration: 5,
        },
        {
          id: "build",
          name: "Build",
          status: "failed",
          duration: 84,
          logs: [
            "✓ Installing dependencies...",
            "✗ TypeScript compilation failed",
            "Error: Type 'string' is not assignable to type 'number'",
            "Build failed with exit code 1",
          ],
        },
        {
          id: "test",
          name: "Test",
          status: "skipped",
        },
        {
          id: "deploy",
          name: "Deploy",
          status: "skipped",
        },
      ],
    },
  ]);

  const [repositories] = useState<Repository[]>([
    {
      id: "repo-1",
      name: "syncertica-enterprise",
      url: "https://github.com/anandavicky123/syncerticaenterprise",
      lastCommit: "feat: Add AI assistant integration",
      author: "Jane Employee",
      branch: "main",
      language: "TypeScript",
      size: "12.3 MB",
    },
    {
      id: "repo-2",
      name: "syncertica-lambda-functions",
      url: "codecommit://syncertica-lambda",
      lastCommit: "fix: Update Cognito token validation",
      author: "John Admin",
      branch: "main",
      language: "Node.js",
      size: "2.1 MB",
    },
    {
      id: "repo-3",
      name: "syncertica-infrastructure",
      url: "codecommit://syncertica-iac",
      lastCommit: "update: CloudFormation templates",
      author: "Mike Manager",
      branch: "main",
      language: "YAML",
      size: "456 KB",
    },
  ]);

  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(
    null
  );

  // Simulate real-time pipeline updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPipelines((prev) =>
        prev.map((pipeline) => {
          if (pipeline.status === "running") {
            // Update running pipeline
            const runningStage = pipeline.stages.find(
              (s) => s.status === "running"
            );
            if (runningStage) {
              const updatedStages = pipeline.stages.map((stage) => {
                if (stage.id === runningStage.id) {
                  return { ...stage, duration: (stage.duration || 0) + 1 };
                }
                return stage;
              });
              return {
                ...pipeline,
                stages: updatedStages,
                duration: pipeline.duration + 1,
              };
            }
          }
          return pipeline;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "running":
        return <Play className="w-5 h-5 text-blue-500 animate-pulse" />;
      case "pending":
        return <Clock className="w-5 h-5 text-gray-400" />;
      case "skipped":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "failed":
        return "bg-red-50 border-red-200 text-red-800";
      case "running":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "pending":
        return "bg-gray-50 border-gray-200 text-gray-600";
      case "skipped":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-600";
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getSuccessRate = () => {
    const total = pipelines.length;
    const successful = pipelines.filter((p) => p.status === "success").length;
    return Math.round((successful / total) * 100);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DevOps Pipeline</h2>
          <p className="text-gray-600">
            AWS CodePipeline, CodeBuild & CodeCommit Integration
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Success Rate:{" "}
            <span className="font-bold text-green-600">
              {getSuccessRate()}%
            </span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Play className="w-4 h-4" />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* AWS Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">CodeCommit</h3>
              <p className="text-sm text-green-600">Connected</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">CodeBuild</h3>
              <p className="text-sm text-green-600">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">CodePipeline</h3>
              <p className="text-sm text-green-600">Running</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">CodeDeploy</h3>
              <p className="text-sm text-green-600">Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Active Pipelines
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(pipeline.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {pipeline.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {pipeline.branch}
                      </span>
                      <span className="flex items-center gap-1">
                        <Code className="w-3 h-3" />
                        {pipeline.commit}
                      </span>
                      <span>by {pipeline.author}</span>
                      <span>{new Date(pipeline.lastRun).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                      pipeline.status
                    )}`}
                  >
                    {pipeline.status}
                  </div>
                  <span className="text-sm text-gray-500">
                    {pipeline.status === "running"
                      ? "Running..."
                      : formatDuration(pipeline.duration)}
                  </span>
                  <button
                    onClick={() => setSelectedPipeline(pipeline)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Pipeline Stages */}
              <div className="mt-4 flex items-center gap-2">
                {pipeline.stages.map((stage, index) => (
                  <React.Fragment key={stage.id}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(stage.status)}
                      <span className="text-sm text-gray-700">
                        {stage.name}
                      </span>
                      {stage.duration !== undefined && (
                        <span className="text-xs text-gray-500">
                          ({formatDuration(stage.duration)})
                        </span>
                      )}
                    </div>
                    {index < pipeline.stages.length - 1 && (
                      <div className="w-4 h-px bg-gray-300"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Repositories */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Repositories</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Code className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{repo.name}</h4>
                    <p className="text-sm text-gray-600">{repo.lastCommit}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{repo.language}</span>
                      <span>{repo.size}</span>
                      <span>by {repo.author}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {repo.branch}
                  </span>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline Details Modal */}
      {selectedPipeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pipeline: {selectedPipeline.name}
                </h3>
                <button
                  onClick={() => setSelectedPipeline(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {selectedPipeline.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(stage.status)}
                        <h4 className="font-medium text-gray-900">
                          {stage.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4">
                        {stage.duration !== undefined && (
                          <span className="text-sm text-gray-500">
                            {formatDuration(stage.duration)}
                          </span>
                        )}
                        {stage.artifacts && (
                          <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
                            <Download className="w-3 h-3" />
                            Artifacts ({stage.artifacts.length})
                          </button>
                        )}
                        {stage.logs && (
                          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm">
                            <Eye className="w-3 h-3" />
                            Logs
                          </button>
                        )}
                      </div>
                    </div>
                    {stage.logs && (
                      <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
                        {stage.logs.map((log, index) => (
                          <div key={index}>{log}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Build Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pipeline Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">94%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">3m 45s</div>
            <div className="text-sm text-gray-600">Avg Build Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">127</div>
            <div className="text-sm text-gray-600">Total Builds</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">15</div>
            <div className="text-sm text-gray-600">Deployments Today</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevOpsPipeline;
