"use client";

import React, { useState } from "react";
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
  RefreshCw,
  Github,
} from "lucide-react";
import { useGitHubActions } from "../hooks/useGitHubActions";
import { Pipeline, PipelineStage } from "../../../shared/types/dashboard";

interface DeploymentInfo {
  service: string;
  status: string;
  environment: string;
  lastDeployed: string;
  lastDeployment: string;
  version: string;
}

interface DevOpsPipelineProps {
  className?: string;
}

const DevOpsPipeline: React.FC<DevOpsPipelineProps> = ({ className = "" }) => {
  const {
    pipelines,
    repository,
    deployments,
    loading,
    error,
    lastUpdated,
    statistics,
    refreshData,
    triggerWorkflow,
  } = useGitHubActions();

  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(
    null
  );

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DevOps Pipeline</h2>
          <p className="text-gray-600">
            GitHub Actions, AWS Integration & Real-time Monitoring
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg">
              {error}
            </div>
          )}
          <div className="text-sm text-gray-600">
            Success Rate:{" "}
            <span className="font-bold text-green-600">
              {statistics.successRate}%
            </span>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => triggerWorkflow("ci-cd")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* GitHub Actions & AWS Services Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">GitHub Actions</h3>
              <p className="text-sm text-green-600">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AWS ECR</h3>
              <p className="text-sm text-green-600">Connected</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AWS ECS</h3>
              <p className="text-sm text-green-600">Running</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Terraform</h3>
              <p className="text-sm text-green-600">Deployed</p>
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
          {pipelines.map((pipeline: Pipeline) => (
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
                {pipeline.stages.map((stage: PipelineStage, index: number) => (
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
          <h3 className="text-lg font-semibold text-gray-900">Repository</h3>
        </div>
        <div className="p-6">
          {repository ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Github className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {repository.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {repository.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{repository.language}</span>
                    <span>{repository.size}</span>
                    <span>Branch: {repository.branch}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {loading
                ? "Loading repository data..."
                : "No repository data available"}
            </div>
          )}
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
                {selectedPipeline.stages.map((stage: PipelineStage) => (
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
                        {stage.logs?.map((log: string, index: number) => (
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
            <div className="text-2xl font-bold text-blue-600">
              {statistics.successRate}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatDuration(statistics.avgDuration)}
            </div>
            <div className="text-sm text-gray-600">Avg Build Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statistics.total}
            </div>
            <div className="text-sm text-gray-600">Total Builds</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {statistics.running}
            </div>
            <div className="text-sm text-gray-600">Running Now</div>
          </div>
        </div>

        {/* Deployment Status */}
        {deployments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-blue-200">
            <h4 className="font-medium text-gray-900 mb-3">
              AWS Deployment Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deployments.map((deployment: DeploymentInfo, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900 capitalize">
                        {deployment.environment}
                      </h5>
                      <p className="text-sm text-gray-600">
                        Version: {deployment.version}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(deployment.lastDeployment).toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        deployment.status === "deployed"
                          ? "bg-green-100 text-green-800"
                          : deployment.status === "deploying"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {deployment.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevOpsPipeline;
