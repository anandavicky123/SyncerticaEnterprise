"use client";

import React, { useState } from "react";
import {
  Folder,
  GitBranch,
  Cloud,
  Container,
  Github,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Play,
  Edit,
  Trash2,
  Download,
  Eye,
  Settings,
  FileText,
  Plus,
} from "lucide-react";
import { useGitHubData } from "../hooks/useGitHubData";
import WorkflowEditorModal from "../ui/WorkflowEditorModal";
import InfrastructureEditorModal from "../ui/InfrastructureEditorModal";
import ContainerEditorModal from "../ui/ContainerEditorModal";
import WorkflowLogsModal from "../ui/WorkflowLogsModal";

interface ProjectsProps {
  className?: string;
}

const Projects: React.FC<ProjectsProps> = ({ className = "" }) => {
  const {
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
  } = useGitHubData();

  // Debug logging to see when data changes
  React.useEffect(() => {
    console.log("🔍 Projects component - data updated:");
    console.log("  - Repositories:", repositories.length);
    console.log("  - Workflows:", workflows.length);
    console.log("  - Infrastructure:", infrastructure.length);
    console.log("  - Containers:", containers.length);
    console.log("  - Connection status:", connectionStatus.connected);
    console.log("  - Loading:", loading);
    console.log("  - Error:", error);
  }, [
    repositories,
    workflows,
    infrastructure,
    containers,
    connectionStatus,
    loading,
    error,
  ]);

  const [activeTab, setActiveTab] = useState<
    "repositories" | "cicd" | "infrastructure" | "container"
  >("repositories");

  // Modal states
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showInfrastructureEditor, setShowInfrastructureEditor] =
    useState(false);
  const [showContainerEditor, setShowContainerEditor] = useState(false);
  const [showWorkflowLogs, setShowWorkflowLogs] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [selectedInfrastructure, setSelectedInfrastructure] =
    useState<any>(null);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failure":
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "in_progress":
      case "running":
        return <Play className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Github className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handler functions for modal actions
  const handleRunWorkflow = async (workflow: any) => {
    console.log("🚀 Attempting to run workflow:", workflow);

    try {
      const response = await fetch("/api/workflows/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repository: workflow.repository,
          workflow: workflow.filename,
        }),
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Workflow triggered:", result);
        alert(`Workflow triggered successfully: ${result.message}`);
        refreshData(); // Refresh data to get updated status
      } else {
        const error = await response.json();
        console.error("❌ Workflow run failed:", error);

        if (response.status === 401) {
          alert(
            "Authentication required. Please connect to GitHub first and try again."
          );
        } else if (response.status === 404) {
          alert(`Workflow not found: ${error.error}`);
        } else {
          alert(
            `Failed to run workflow: ${error.error}\n\nDetails: ${
              error.details || "Unknown error"
            }`
          );
        }
      }
    } catch (error) {
      console.error("❌ Error running workflow:", error);
      alert(
        "Network error: Failed to run workflow. Please check your connection and try again."
      );
    }
  };

  const handleEditWorkflow = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setEditorMode("edit");
    setShowWorkflowEditor(true);
  };

  const handleViewLogs = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setShowWorkflowLogs(true);
  };

  const handleEditInfrastructure = (infrastructure: any) => {
    setSelectedInfrastructure(infrastructure);
    setEditorMode("edit");
    setShowInfrastructureEditor(true);
  };

  const handleEditContainer = (container: any) => {
    setSelectedContainer(container);
    setEditorMode("edit");
    setShowContainerEditor(true);
  };

  const handleSaveWorkflow = async (
    content: string,
    filename?: string,
    repository?: string
  ) => {
    try {
      console.log("Saving workflow:", { content, filename, repository });
      alert(
        "Workflow saved successfully! (Note: This is a demo - actual GitHub integration would save to repository)"
      );
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert("Failed to save workflow. Please try again.");
    }
  };

  const handleSaveInfrastructure = async (
    content: string,
    filename?: string,
    repository?: string,
    type?: string
  ) => {
    try {
      console.log("Saving infrastructure:", {
        content,
        filename,
        repository,
        type,
      });
      alert(
        "Infrastructure saved successfully! (Note: This is a demo - actual GitHub integration would save to repository)"
      );
    } catch (error) {
      console.error("Error saving infrastructure:", error);
      alert("Failed to save infrastructure. Please try again.");
    }
  };

  const handleSaveContainer = async (
    content: string,
    filename?: string,
    repository?: string,
    type?: string
  ) => {
    try {
      console.log("Saving container:", { content, filename, repository, type });
      alert(
        "Container configuration saved successfully! (Note: This is a demo - actual GitHub integration would save to repository)"
      );
    } catch (error) {
      console.error("Error saving container:", error);
      alert("Failed to save container. Please try again.");
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* GitHub Status Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Github className="w-8 h-8 text-gray-800" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
              <p className="text-gray-600">
                GitHub Integration & DevOps Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {connectionStatus.connected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">Connected</span>
                  {connectionStatus.user && (
                    <span className="text-gray-600">
                      as {connectionStatus.user.login}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 font-medium">Disconnected</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshData}
                disabled={loading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                title={`Refresh all GitHub data: ${repositories.length} repos, ${workflows.length} workflows, ${infrastructure.length} infrastructure files, ${containers.length} containers`}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              {connectionStatus.connected ? (
                <button
                  onClick={disconnectFromGitHub}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectToGitHub}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Connect to GitHub
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
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
            Repositories ({repositories.length})
          </button>
          <button
            onClick={() => setActiveTab("cicd")}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "cicd"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <GitBranch className="w-4 h-4" />
            CI/CD ({workflows.length})
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
            Infrastructure ({infrastructure.length})
          </button>
          <button
            onClick={() => setActiveTab("container")}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "container"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Container className="w-4 h-4" />
            Container ({containers.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Repositories Tab */}
        {activeTab === "repositories" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Repositories ({repositories.length})
              </h3>
            </div>

            {repositories.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {connectionStatus.connected
                    ? "No repositories found"
                    : "Connect to GitHub to view repositories"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Folder className="w-5 h-5 text-blue-500" />
                          <h4 className="font-medium text-gray-900">
                            {repo.name}
                          </h4>
                          {repo.private && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              Private
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {repo.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{repo.language || "Unknown"}</span>
                          <span>⭐ {repo.stargazers_count}</span>
                          <span>🍴 {repo.forks_count}</span>
                          <span>Updated {formatDate(repo.updated_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(repo.html_url, "_blank")}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CI/CD Tab */}
        {activeTab === "cicd" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Workflow Files ({workflows.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedWorkflow(null);
                  setEditorMode("create");
                  setShowWorkflowEditor(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Workflow
              </button>
            </div>

            {workflows.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {connectionStatus.connected
                    ? "No workflow files found"
                    : "Connect to GitHub to view workflows"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(workflow.status)}
                          <h4 className="font-medium text-gray-900">
                            {workflow.filename}
                          </h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {workflow.state}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {workflow.repository} • {workflow.path}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            Status: {workflow.conclusion || workflow.status}
                          </span>
                          <span>Updated {formatDate(workflow.updated_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            window.open(workflow.html_url, "_blank")
                          }
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="View on GitHub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRunWorkflow(workflow)}
                          className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded"
                          title="Run Workflow"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditWorkflow(workflow)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit Workflow"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewLogs(workflow)}
                          className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded"
                          title="View Logs"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Infrastructure Tab */}
        {activeTab === "infrastructure" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Infrastructure Files ({infrastructure.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedInfrastructure(null);
                  setEditorMode("create");
                  setShowInfrastructureEditor(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Infrastructure
              </button>
            </div>

            {infrastructure.length === 0 ? (
              <div className="text-center py-12">
                <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {connectionStatus.connected
                    ? "No infrastructure files found"
                    : "Connect to GitHub to view infrastructure files"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {infrastructure.map((infra) => (
                  <div
                    key={infra.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Cloud className="w-5 h-5 text-orange-500" />
                          <h4 className="font-medium text-gray-900">
                            {infra.name}
                          </h4>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            {infra.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {infra.repository} • {infra.path}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="View Content"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditInfrastructure(infra)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit Infrastructure"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Container Tab */}
        {activeTab === "container" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Container Files ({containers.length})
              </h3>
              <button
                onClick={() => {
                  setSelectedContainer(null);
                  setEditorMode("create");
                  setShowContainerEditor(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Container
              </button>
            </div>

            {containers.length === 0 ? (
              <div className="text-center py-12">
                <Container className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {connectionStatus.connected
                    ? "No container files found"
                    : "Connect to GitHub to view container files"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {containers.map((container) => (
                  <div
                    key={container.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Container className="w-5 h-5 text-purple-500" />
                          <h4 className="font-medium text-gray-900">
                            {container.name}
                          </h4>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            {container.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {container.repository} • {container.path}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="View Content"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditContainer(container)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit Container"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <WorkflowEditorModal
        isOpen={showWorkflowEditor}
        onClose={() => setShowWorkflowEditor(false)}
        workflow={selectedWorkflow}
        mode={editorMode}
        onSave={handleSaveWorkflow}
      />

      <InfrastructureEditorModal
        isOpen={showInfrastructureEditor}
        onClose={() => setShowInfrastructureEditor(false)}
        infrastructure={selectedInfrastructure}
        mode={editorMode}
        onSave={handleSaveInfrastructure}
      />

      <ContainerEditorModal
        isOpen={showContainerEditor}
        onClose={() => setShowContainerEditor(false)}
        container={selectedContainer}
        mode={editorMode}
        onSave={handleSaveContainer}
      />

      {selectedWorkflow && (
        <WorkflowLogsModal
          isOpen={showWorkflowLogs}
          onClose={() => setShowWorkflowLogs(false)}
          workflow={selectedWorkflow}
        />
      )}
    </div>
  );
};

export default Projects;
