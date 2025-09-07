"use client";

import React from "react";
import { useGitHubData } from "../hooks/useGitHubData";

export default function DebugPage() {
  const {
    repositories,
    workflows,
    infrastructure,
    containers,
    connectionStatus,
    loading,
    error,
  } = useGitHubData();

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">GitHub Data Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="space-y-2">
            <p>
              <strong>Connected:</strong>{" "}
              {connectionStatus.connected ? "Yes" : "No"}
            </p>
            <p>
              <strong>User:</strong> {connectionStatus.user?.login || "N/A"}
            </p>
            <p>
              <strong>Loading:</strong> {loading ? "Yes" : "No"}
            </p>
            <p>
              <strong>Error:</strong> {error || "None"}
            </p>
          </div>
        </div>

        {/* Repositories */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Repositories ({repositories.length})
          </h2>
          <div className="max-h-40 overflow-y-auto">
            {repositories.length === 0 ? (
              <p className="text-gray-500">No repositories found</p>
            ) : (
              repositories.map((repo) => (
                <div key={repo.id} className="border-b py-2">
                  <p className="font-medium">{repo.name}</p>
                  <p className="text-sm text-gray-600">{repo.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Workflows */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Workflows ({workflows.length})
          </h2>
          <div className="max-h-40 overflow-y-auto">
            {workflows.length === 0 ? (
              <p className="text-gray-500">No workflows found</p>
            ) : (
              workflows.map((workflow) => (
                <div key={workflow.id} className="border-b py-2">
                  <p className="font-medium">{workflow.filename}</p>
                  <p className="text-sm text-gray-600">{workflow.repository}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Infrastructure */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Infrastructure ({infrastructure.length})
          </h2>
          <div className="max-h-40 overflow-y-auto">
            {infrastructure.length === 0 ? (
              <p className="text-gray-500">No infrastructure found</p>
            ) : (
              infrastructure.map((infra) => (
                <div key={infra.id} className="border-b py-2">
                  <p className="font-medium">{infra.name}</p>
                  <p className="text-sm text-gray-600">{infra.repository}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Containers */}
        <div className="bg-white p-6 rounded-lg shadow col-span-full">
          <h2 className="text-xl font-semibold mb-4">
            Containers ({containers.length})
          </h2>
          <div className="max-h-40 overflow-y-auto">
            {containers.length === 0 ? (
              <p className="text-gray-500">No containers found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {containers.map((container) => (
                  <div key={container.id} className="border rounded p-3">
                    <p className="font-medium">{container.name}</p>
                    <p className="text-sm text-gray-600">{container.type}</p>
                    <p className="text-sm text-gray-600">
                      {container.repository}
                    </p>
                    <p className="text-xs text-gray-500">{container.path}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raw Data */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Raw Data (JSON)</h2>
        <div className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
          <pre>
            {JSON.stringify(
              {
                repositories: repositories.length,
                workflows: workflows.length,
                infrastructure: infrastructure.length,
                containers: containers.length,
                connectionStatus,
                loading,
                error,
                containerData: containers.slice(0, 3), // Show first 3 containers
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
