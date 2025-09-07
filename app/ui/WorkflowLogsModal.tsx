"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface WorkflowLog {
  id: string;
  name: string;
  status: "success" | "failure" | "in_progress" | "pending";
  conclusion: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  run_number: number;
  jobs?: {
    id: string;
    name: string;
    status: string;
    conclusion: string;
    started_at: string;
    completed_at: string;
    steps?: {
      name: string;
      status: string;
      conclusion: string;
      number: number;
      started_at: string;
      completed_at: string;
    }[];
  }[];
}

interface WorkflowLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: {
    id: string;
    filename: string;
    repository: string;
    html_url: string;
  };
}

const WorkflowLogsModal: React.FC<WorkflowLogsModalProps> = ({
  isOpen,
  onClose,
  workflow,
}) => {
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<WorkflowLog | null>(null);

  const fetchWorkflowRuns = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch workflow runs from GitHub API
      const response = await fetch(
        `/api/workflows/logs?repository=${workflow.repository}&workflow=${workflow.filename}`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch workflow runs: ${response.statusText}`
        );
      }
      const data = await response.json();
      setLogs(data.runs || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch workflow logs"
      );
    } finally {
      setLoading(false);
    }
  }, [workflow.repository, workflow.filename]);

  useEffect(() => {
    if (isOpen && workflow) {
      fetchWorkflowRuns();
    }
  }, [isOpen, workflow, fetchWorkflowRuns]);

  const getStatusIcon = (status: string, conclusion?: string) => {
    if (status === "completed") {
      if (conclusion === "success") {
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      } else if (conclusion === "failure") {
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      }
    }
    if (status === "in_progress") {
      return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
    }
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusText = (status: string, conclusion?: string) => {
    if (status === "completed") {
      return conclusion === "success" ? "Success" : "Failed";
    }
    return status === "in_progress" ? "Running" : "Pending";
  };

  const getStatusColor = (status: string, conclusion?: string) => {
    if (status === "completed") {
      return conclusion === "success"
        ? "text-green-700 bg-green-100"
        : "text-red-700 bg-red-100";
    }
    return status === "in_progress"
      ? "text-blue-700 bg-blue-100"
      : "text-gray-700 bg-gray-100";
  };

  const formatDuration = (start: string, end: string) => {
    if (!end) return "Running...";
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Workflow Logs
              </h2>
              <p className="text-sm text-gray-600">
                {workflow.filename} in {workflow.repository}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchWorkflowRuns}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => window.open(workflow.html_url, "_blank")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              View on GitHub
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Runs List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-900">
                Recent Runs ({logs.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">Loading workflow runs...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-4 text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No workflow runs found</p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {logs.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRun(run)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRun?.id === run.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(run.status, run.conclusion)}
                        <span className="font-medium text-sm">
                          #{run.run_number}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            run.status,
                            run.conclusion
                          )}`}
                        >
                          {getStatusText(run.status, run.conclusion)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{run.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(run.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Run Details */}
          <div className="flex-1 flex flex-col">
            {selectedRun ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(
                        selectedRun.status,
                        selectedRun.conclusion
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Run #{selectedRun.run_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedRun.name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(
                        selectedRun.status,
                        selectedRun.conclusion
                      )}`}
                    >
                      {getStatusText(
                        selectedRun.status,
                        selectedRun.conclusion
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Started:</span>
                      <span className="ml-2 text-gray-900">
                        {formatDate(selectedRun.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <span className="ml-2 text-gray-900">
                        {formatDuration(
                          selectedRun.created_at,
                          selectedRun.updated_at
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedRun.jobs && selectedRun.jobs.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRun.jobs.map((job) => (
                        <div
                          key={job.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            {getStatusIcon(job.status, job.conclusion)}
                            <h4 className="font-medium text-gray-900">
                              {job.name}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                job.status,
                                job.conclusion
                              )}`}
                            >
                              {getStatusText(job.status, job.conclusion)}
                            </span>
                          </div>
                          {job.steps && job.steps.length > 0 && (
                            <div className="space-y-2">
                              {job.steps.map((step, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {getStatusIcon(step.status, step.conclusion)}
                                  <span className="text-gray-600">
                                    {step.number}.
                                  </span>
                                  <span className="text-gray-900">
                                    {step.name}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                      step.status,
                                      step.conclusion
                                    )}`}
                                  >
                                    {getStatusText(
                                      step.status,
                                      step.conclusion
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">No job details available</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">
                    Select a workflow run to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowLogsModal;
