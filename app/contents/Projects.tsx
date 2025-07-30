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
  RefreshCw,
  Github,
  Cloud,
  Server,
  Database,
  Network,
  Settings,
  Search,
  Filter,
  Plus,
  Edit,
  FileText,
  Folder,
  Activity,
  Trash2,
  DollarSign,
  Globe,
  AlertCircle,
  Shield,
  Key,
  Info,
} from "lucide-react";
import { useGitHubActions } from "../hooks/useGitHubActions";
import { Pipeline, PipelineStage, Repository } from "../shared/types/dashboard";
import { getConfigSummary, isDevelopment } from "../shared/config/environment";

interface CloudFormationStack {
  id: string;
  name: string;
  status:
    | "CREATE_COMPLETE"
    | "UPDATE_COMPLETE"
    | "ROLLBACK_COMPLETE"
    | "CREATE_IN_PROGRESS"
    | "DELETE_IN_PROGRESS"
    | "FAILED";
  template: string;
  region: string;
  resources: number;
  lastUpdated: string;
  driftStatus: "DRIFTED" | "IN_SYNC" | "NOT_CHECKED";
  cost: number;
}

interface ProjectsProps {
  className?: string;
}

const Projects: React.FC<ProjectsProps> = ({ className = "" }) => {
  const {
    pipelines,
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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "repositories" | "pipeline" | "infrastructure"
  >("repositories");
  const [selectedBranches, setSelectedBranches] = useState<{
    [key: string]: string;
  }>({});
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Get current environment configuration
  const configSummary = getConfigSummary();
  const currentMode = isDevelopment() ? "development" : "production";

  // Mock repositories data
  const [repositories] = useState<Repository[]>([
    {
      id: "repo-1",
      name: "syncertica-frontend",
      source: "GitHub",
      branch: "main",
      lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      status: "Connected",
      description: "Frontend application built with React and TypeScript",
      detectedFiles: {
        dockerfile: true,
        workflow: true,
        terraform: false,
      },
      connectionType: "GitHub OAuth",
      infraStatus: "deployed",
      infraResources: 12,
      infraCost: "45.32",
    },
    {
      id: "repo-2",
      name: "syncertica-backend",
      source: "GitHub",
      branch: "develop",
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      status: "Connected",
      description: "Backend API services with Node.js and Express",
      detectedFiles: {
        dockerfile: true,
        workflow: true,
        terraform: true,
      },
      connectionType: "Personal Access Token",
      infraStatus: "deploying",
      infraResources: 8,
      infraCost: "23.15",
    },
    {
      id: "repo-3",
      name: "infrastructure",
      source: "GitLab",
      branch: "main",
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      status: "Error",
      description: "Infrastructure as Code with Terraform modules",
      detectedFiles: {
        dockerfile: false,
        workflow: false,
        terraform: true,
      },
      connectionType: "GitLab Token",
      infraStatus: "failed",
      infraResources: 0,
      infraCost: "0.00",
    },
  ]);

  // Mock CloudFormation stacks data
  const [stacks] = useState<CloudFormationStack[]>([
    {
      id: "stack-1",
      name: "syncertica-vpc-network",
      status: "CREATE_COMPLETE",
      template: "vpc-template.yaml",
      region: "us-east-1",
      resources: 15,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      driftStatus: "IN_SYNC",
      cost: 45.67,
    },
    {
      id: "stack-2",
      name: "syncertica-ecs-cluster",
      status: "UPDATE_COMPLETE",
      template: "ecs-cluster.yaml",
      region: "us-east-1",
      resources: 8,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      driftStatus: "IN_SYNC",
      cost: 127.89,
    },
    {
      id: "stack-3",
      name: "syncertica-database",
      status: "CREATE_COMPLETE",
      template: "rds-database.yaml",
      region: "us-east-1",
      resources: 6,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      driftStatus: "DRIFTED",
      cost: 89.45,
    },
  ]);

  const cloudFormationTemplates = {
    "vpc-template.yaml": `AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC Network Infrastructure for Syncertica Enterprise'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'syncertica-vpc-\${Environment}'`,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "CREATE_COMPLETE":
      case "UPDATE_COMPLETE":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
      case "FAILED":
      case "ROLLBACK_COMPLETE":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "running":
      case "CREATE_IN_PROGRESS":
      case "DELETE_IN_PROGRESS":
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
      case "CREATE_COMPLETE":
      case "UPDATE_COMPLETE":
        return "bg-green-50 border-green-200 text-green-800";
      case "failed":
      case "FAILED":
      case "ROLLBACK_COMPLETE":
        return "bg-red-50 border-red-200 text-red-800";
      case "running":
      case "CREATE_IN_PROGRESS":
      case "DELETE_IN_PROGRESS":
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

  const getTotalCost = () => {
    return stacks.reduce((total, stack) => total + stack.cost, 0).toFixed(2);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            {/* Mode Indicator */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  currentMode === "development"
                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                    : "bg-green-100 text-green-800 border border-green-200"
                }`}
              >
                {currentMode === "development" ? (
                  <>
                    <Key className="w-3 h-3" />
                    DEVELOPMENT MODE
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3" />
                    PRODUCTION MODE
                  </>
                )}
              </span>
              <button
                onClick={() => setShowConfigModal(true)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Configuration"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-gray-600">
            DevOps Pipeline, Infrastructure as Code & AWS Integration
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
          <div className="text-sm text-gray-600">
            Monthly Cost:{" "}
            <span className="font-bold text-blue-600">${getTotalCost()}</span>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("repositories")}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "repositories"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Folder className="w-4 h-4" />
            Repositories
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "pipeline"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            CI/CD
          </button>
          <button
            onClick={() => setActiveTab("infrastructure")}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "infrastructure"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Cloud className="w-4 h-4" />
            Infrastructure
          </button>
        </nav>
      </div>

      {/* Repositories Tab */}
      {activeTab === "repositories" && (
        <div className="space-y-6">
          {/* Repositories Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshData}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh Projects
              </button>
              <button
                onClick={() => {
                  /* Open repositories modal */
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Connect Repository
              </button>
            </div>
          </div>

          {/* Repositories List */}
          <div className="space-y-4">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Github className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">
                        {repo.name}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        repo.source === "GitHub"
                          ? "bg-gray-100 text-gray-700"
                          : repo.source === "GitLab"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {repo.source}
                    </span>
                    <select
                      value={selectedBranches[repo.id] || repo.branch}
                      onChange={(e) =>
                        setSelectedBranches({
                          ...selectedBranches,
                          [repo.id]: e.target.value,
                        })
                      }
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="main">main</option>
                      <option value="develop">develop</option>
                      <option value="staging">staging</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        repo.status === "Connected"
                          ? "bg-green-100 text-green-800"
                          : repo.status === "Error"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {repo.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Detected Files:
                      </span>
                      {repo.detectedFiles.dockerfile && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Dockerfile
                        </span>
                      )}
                      {repo.detectedFiles.workflow && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          .yml
                        </span>
                      )}
                      {repo.detectedFiles.terraform && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          .tf
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Updated {new Date(repo.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      Preview Pipeline
                    </button>
                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors">
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edit Config
                    </button>
                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors">
                      <FileText className="w-4 h-4 inline mr-1" />
                      View Files
                    </button>
                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors">
                      Re-Scan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CI/CD Pipeline Tab */}
      {activeTab === "pipeline" && (
        <div className="space-y-6">
          {/* Main CI/CD Toolbar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                CI/CD Pipeline Management
              </h3>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Create Pipeline
                </button>
                <button
                  onClick={() => triggerWorkflow("all")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Run All Pipelines
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Pipeline Logs
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 mr-2 inline" />
                  CI/CD Settings
                </button>
              </div>
            </div>

            {/* Pipeline Status Filter */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Filter by status:</span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  Success
                </button>
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  Failed
                </button>
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  In Progress
                </button>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  All
                </button>
              </div>
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
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Pipelines
              </h3>
              <button
                onClick={() => triggerWorkflow("ci-cd")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                Run Pipeline
              </button>
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
                          <span>
                            {new Date(pipeline.lastRun).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => triggerWorkflow(pipeline.id)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Run Pipeline"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          className="px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Workflow"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedPipeline(pipeline)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="View Logs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="px-3 py-1 text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title="Rerun Last Job"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                          title="View Artifact"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Visualization */}
                  <div className="mt-4 flex items-center gap-2">
                    {pipeline.stages.map(
                      (stage: PipelineStage, index: number) => (
                        <React.Fragment key={stage.id}>
                          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg min-w-0">
                            {getStatusIcon(stage.status)}
                            <span className="text-sm text-gray-700 font-medium">
                              {stage.name}
                            </span>
                            {stage.duration !== undefined && (
                              <span className="text-xs text-gray-500">
                                ({formatDuration(stage.duration)})
                              </span>
                            )}
                          </div>
                          {index < pipeline.stages.length - 1 && (
                            <div className="flex items-center">
                              <div className="w-6 h-px bg-gray-300"></div>
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              <div className="w-6 h-px bg-gray-300"></div>
                            </div>
                          )}
                        </React.Fragment>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure Tab */}
      {activeTab === "infrastructure" && (
        <div className="space-y-6">
          {/* Infrastructure Main Toolbar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Play className="w-4 h-4" />
                  Deploy Infra
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Activity className="w-4 h-4" />
                  Infra Status
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Refresh Infra
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Settings className="w-4 h-4" />
                  Infra Settings
                </button>
              </div>
              <div className="flex items-center gap-3">
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>All Environments</option>
                  <option>Production</option>
                  <option>Staging</option>
                  <option>Development</option>
                </select>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option>All Providers</option>
                  <option>AWS</option>
                  <option>Azure</option>
                  <option>GCP</option>
                </select>
              </div>
            </div>
          </div>

          {/* AWS Services Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">CloudFormation</h3>
                  <p className="text-sm text-green-600">
                    {stacks.filter((s) => s.status.includes("COMPLETE")).length}{" "}
                    Active Stacks
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">EC2 Instances</h3>
                  <p className="text-sm text-green-600">3 Running</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">RDS Databases</h3>
                  <p className="text-sm text-green-600">2 Available</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Network className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">VPC Networks</h3>
                  <p className="text-sm text-green-600">2 Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Per-Project Infrastructure Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Project Infrastructure
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <GitBranch className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {repo.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {repo.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            repo.infraStatus === "deployed"
                              ? "bg-green-100 text-green-800"
                              : repo.infraStatus === "deploying"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {repo.infraStatus || "Not Deployed"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {repo.infraResources || 0}
                        </div>
                        <div className="text-sm text-gray-500">Resources</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          ${repo.infraCost || "0.00"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Monthly Cost
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-colors">
                        <Play className="w-3 h-3" />
                        Deploy
                      </button>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-colors">
                        <Settings className="w-3 h-3" />
                        Configure
                      </button>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-colors">
                        <Eye className="w-3 h-3" />
                        Monitor
                      </button>
                      <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-colors">
                        <RefreshCw className="w-3 h-3" />
                        Update
                      </button>
                      <button className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm transition-colors">
                        <Trash2 className="w-3 h-3" />
                        Destroy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CloudFormation Stacks */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                CloudFormation Stacks
              </h3>
              <div className="flex items-center gap-3">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Sync All
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Play className="w-4 h-4" />
                  Deploy Stack
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {stacks.map((stack) => (
                <div
                  key={stack.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(stack.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {stack.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>{stack.template}</span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {stack.region}
                          </span>
                          <span className="flex items-center gap-1">
                            <Server className="w-3 h-3" />
                            {stack.resources} resources
                          </span>
                          <span>
                            Updated{" "}
                            {new Date(stack.lastUpdated).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          stack.status
                        )}`}
                      >
                        {stack.status.replace(/_/g, " ")}
                      </div>
                      <div
                        className={`text-sm font-medium flex items-center gap-1 ${
                          stack.driftStatus === "IN_SYNC"
                            ? "text-green-600"
                            : stack.driftStatus === "DRIFTED"
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {stack.driftStatus === "IN_SYNC" ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            In Sync
                          </>
                        ) : stack.driftStatus === "DRIFTED" ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Drifted
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Not Checked
                          </>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />${stack.cost}
                      </span>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Play className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Templates Library */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Infrastructure Templates
              </h3>
              <div className="flex items-center gap-3">
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Download className="w-4 h-4" />
                  Import Template
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(cloudFormationTemplates).map(
                  ([filename, content]) => (
                    <div
                      key={filename}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-orange-600" />
                          </div>
                          <h4 className="font-medium text-gray-900">
                            {filename}
                          </h4>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setSelectedTemplate(
                                selectedTemplate === filename ? null : filename
                              )
                            }
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Play className="w-3 h-3" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        CloudFormation template for infrastructure deployment
                      </p>
                      {selectedTemplate === filename ? (
                        <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto max-h-40 overflow-y-auto">
                          {content}
                        </pre>
                      ) : (
                        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                          Click to view template content...
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Resource Monitoring */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Resource Monitoring
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        CPU Usage
                      </p>
                      <p className="text-2xl font-bold text-blue-900">67%</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        Memory Usage
                      </p>
                      <p className="text-2xl font-bold text-green-900">43%</p>
                    </div>
                    <Server className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">
                        Storage Usage
                      </p>
                      <p className="text-2xl font-bold text-yellow-900">78%</p>
                    </div>
                    <Database className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">
                        Network Traffic
                      </p>
                      <p className="text-2xl font-bold text-purple-900">
                        2.1 GB
                      </p>
                    </div>
                    <Network className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentMode === "development" ? (
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Key className="w-5 h-5 text-orange-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Environment Configuration
                    </h3>
                    <p className="text-sm text-gray-500">
                      Current mode: {currentMode.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {/* Mode Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Mode Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`p-3 rounded-lg border-2 ${
                        currentMode === "development"
                          ? "border-orange-200 bg-orange-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-gray-900">
                          Debug Mode
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Uses explicit tokens and keys for development
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-lg border-2 ${
                        currentMode === "production"
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">
                          Production Mode
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Uses GitHub Secrets for production security
                      </p>
                    </div>
                  </div>
                </div>

                {/* GitHub Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub Configuration
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Token Status:
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          configSummary.github.hasToken
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {configSummary.github.hasToken
                          ? "Available"
                          : "Missing"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Source:</span>
                      <span className="text-sm font-medium text-gray-900">
                        Environment Variables
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Token Preview:
                      </span>
                      <span className="text-sm font-mono text-gray-700">
                        {configSummary.github.tokenPreview}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AWS Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    AWS Configuration
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Credentials Status:
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          configSummary.aws.hasAccessKey &&
                          configSummary.aws.hasSecretKey
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {configSummary.aws.hasAccessKey &&
                        configSummary.aws.hasSecretKey
                          ? "Available"
                          : "Missing"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Source:</span>
                      <span className="text-sm font-medium text-gray-900">
                        Environment Variables
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Access Key Preview:
                      </span>
                      <span className="text-sm font-mono text-gray-700">
                        {configSummary.aws.accessKeyPreview}
                      </span>
                    </div>
                  </div>
                </div>

                {/* API Configuration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    API Configuration
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Base URL:</span>
                      <span className="text-sm font-mono text-gray-700">
                        {configSummary.api.baseUrl}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Timeout:</span>
                      <span className="text-sm text-gray-700">
                        {configSummary.api.timeout}ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mode Switching Instructions */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Mode Switching
                  </h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <strong>Debug Mode:</strong> Add{" "}
                      <code className="bg-white px-1 rounded">?debug=true</code>{" "}
                      to URL or set{" "}
                      <code className="bg-white px-1 rounded">
                        NEXT_PUBLIC_DEBUG_MODE=true
                      </code>
                    </p>
                    <p>
                      <strong>Release Mode:</strong> Remove debug parameter or
                      set{" "}
                      <code className="bg-white px-1 rounded">
                        NEXT_PUBLIC_DEBUG_MODE=false
                      </code>
                    </p>
                  </div>
                </div>

                {/* Security Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">
                        Security Notice
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Debug mode exposes sensitive credentials in the code.
                        Always use Release mode in production environments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
