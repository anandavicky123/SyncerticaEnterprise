"use client";

import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  Plus,
  Github,
  RefreshCw,
  Folder,
  GitBranch,
  Cloud,
  Container as ContainerIcon,
  CheckCircle,
  XCircle,
  Settings,
  Play,
  Edit,
  Eye,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  useGitHubData,
  Repository,
  Workflow,
  Infrastructure,
  Container,
} from "../hooks/useGitHubData";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  repository?: string | null;
  status: string;
  managerDeviceUUID?: string;
  createdAt?: string;
  updatedAt?: string;
}

type TabType =
  | "projects"
  | "repositories"
  | "cicd"
  | "infrastructure"
  | "container";

const Projects: React.FC<{ className?: string }> = ({ className = "" }) => {
  const {
    repositories = [],
    workflows = [],
    infrastructure = [],
    containers = [],
    connectionStatus = { connected: false, user: null },
    refreshData: refreshGitHubData,
    loading: githubLoading,
  } = useGitHubData();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("projects");

  // Projects state
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repository, setRepository] = useState("");
  const [status, setStatus] = useState("active");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProjectsList(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("Failed to fetch projects", err);
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async () => {
    if (!name) return alert("Project name is required");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          repository: repository || null,
          status,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: Project = await res.json();
      setProjectsList((p) => [created, ...p]);
      setShowAdd(false);
      setName("");
      setDescription("");
      setRepository("");
      setStatus("active");
    } catch (err) {
      console.error("Create project failed", err);
      alert("Failed to create project");
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchProjects();
      if (refreshGitHubData) {
        await refreshGitHubData();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTabClasses = (tab: TabType) => {
    return `py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
      activeTab === tab
        ? "border-blue-500 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
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
                disabled={refreshing || githubLoading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                title={`Refresh all data: ${projectsList.length} projects, ${repositories.length} repos, ${workflows.length} workflows, ${infrastructure.length} infra, ${containers.length} containers`}
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    refreshing || githubLoading ? "animate-spin" : ""
                  }`}
                />
                {refreshing || githubLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("projects")}
            className={getTabClasses("projects")}
          >
            <Folder className="w-4 h-4" /> Projects ({projectsList.length})
          </button>
          <button
            onClick={() => setActiveTab("repositories")}
            className={getTabClasses("repositories")}
          >
            <Folder className="w-4 h-4" /> Repositories ({repositories.length})
          </button>
          <button
            onClick={() => setActiveTab("cicd")}
            className={getTabClasses("cicd")}
          >
            <GitBranch className="w-4 h-4" /> CI/CD ({workflows.length})
          </button>
          <button
            onClick={() => setActiveTab("infrastructure")}
            className={getTabClasses("infrastructure")}
          >
            <Cloud className="w-4 h-4" /> Infrastructure (
            {infrastructure.length})
          </button>
          <button
            onClick={() => setActiveTab("container")}
            className={getTabClasses("container")}
          >
            <ContainerIcon className="w-4 h-4" /> Container ({containers.length}
            )
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Projects ({projectsList.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  onClick={() => setShowAdd(true)}
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading projects...</p>
              </div>
            ) : projectsList.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No projects yet</p>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
                  onClick={() => setShowAdd(true)}
                >
                  <Plus className="w-4 h-4" /> Create Your First Project
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {projectsList.map((project) => (
                  <div
                    key={project.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Folder className="w-5 h-5 text-blue-500" />
                          <h4 className="font-medium text-gray-900">
                            {project.name}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              project.status === "active"
                                ? "bg-green-100 text-green-800"
                                : project.status === "on-hold"
                                ? "bg-yellow-100 text-yellow-800"
                                : project.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {project.description}
                          </p>
                        )}
                        {project.repository && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Github className="w-3 h-3" />
                            <span>{project.repository}</span>
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {project.createdAt && (
                            <span>Created {formatDate(project.createdAt)}</span>
                          )}
                          {project.updatedAt && (
                            <span>Updated {formatDate(project.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.repository && (
                          <button
                            onClick={() =>
                              window.open(project.repository!, "_blank")
                            }
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                            title="View Repository"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
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
                {repositories.map((repo: Repository) => (
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
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
                {workflows.map((workflow: Workflow) => (
                  <div
                    key={workflow.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <GitBranch className="w-5 h-5 text-green-500" />
                          <h4 className="font-medium text-gray-900">
                            {workflow.filename || workflow.name}
                          </h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {workflow.state || workflow.status}
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
                          className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded"
                          title="Run Workflow"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit Workflow"
                        >
                          <Edit className="w-4 h-4" />
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
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
                {infrastructure.map((infra: Infrastructure) => (
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
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit Infrastructure"
                        >
                          <Edit className="w-4 h-4" />
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />
                Add Container
              </button>
            </div>

            {containers.length === 0 ? (
              <div className="text-center py-12">
                <ContainerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {connectionStatus.connected
                    ? "No container files found"
                    : "Connect to GitHub to view container files"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {containers.map((container: Container) => (
                  <div
                    key={container.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <ContainerIcon className="w-5 h-5 text-purple-500" />
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
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit Container"
                        >
                          <Edit className="w-4 h-4" />
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

      {/* Add Project Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h4 className="text-lg font-semibold mb-4">Create New Project</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProject();
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Project description (optional)"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repository
                  </label>
                  {githubLoading ? (
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-gray-500">
                        Loading repositories...
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        value={repository}
                        onChange={(e) => setRepository(e.target.value)}
                      >
                        <option value="">Select a repository (optional)</option>
                        {repositories.map((repo: Repository) => (
                          <option key={repo.id} value={repo.html_url}>
                            {repo.full_name}
                          </option>
                        ))}
                        <option value="custom">Custom Repository URL</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  )}

                  {repository === "custom" && (
                    <input
                      type="url"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://github.com/username/repository"
                      onChange={(e) => setRepository(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowAdd(false);
                    setName("");
                    setDescription("");
                    setRepository("");
                    setStatus("active");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
