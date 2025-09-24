"use client";

import React, { useState } from "react";
import { X, Save, FileText, ChevronDown } from "lucide-react";
import { useRepositories } from "../hooks/useRepositories";

interface WorkflowEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow?: {
    id: string;
    filename: string;
    repository: string;
    content?: string;
  } | null;
  mode: "create" | "edit";
  onSave: (content: string, filename?: string, repository?: string) => void;
}

const WorkflowEditorModal: React.FC<WorkflowEditorModalProps> = ({
  isOpen,
  onClose,
  workflow,
  mode,
  onSave,
}) => {
  const [content, setContent] = useState(
    workflow?.content ||
      `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: echo "Deploying to production..."
`,
  );

  const [filename, setFilename] = useState(
    workflow?.filename || "ci-cd-pipeline.yml",
  );
  const [repository, setRepository] = useState(workflow?.repository || "");
  const [saving, setSaving] = useState(false);

  // Fetch repositories for dropdown
  const {
    repositories,
    loading: repositoriesLoading,
    error: repositoriesError,
  } = useRepositories();

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!repository) {
      alert("Please select a repository");
      return;
    }

    if (!filename.trim()) {
      alert("Please enter a filename");
      return;
    }

    if (!content.trim()) {
      alert("Please enter workflow content");
      return;
    }

    setSaving(true);
    try {
      await onSave(content, filename, repository);
      onClose();
    } catch (error) {
      console.error("Error in handleSave:", error);
    } finally {
      setSaving(false);
    }
  };

  // Preview removed

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === "create" ? "Create Workflow" : "Edit Workflow"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Preview removed */}
            <button
              onClick={handleSave}
              disabled={saving || !repository}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Fields */}
        {mode === "create" && (
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="workflow-name.yml"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository
                </label>
                {repositoriesLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Loading repositories...
                  </div>
                ) : repositoriesError ? (
                  <div className="w-full px-3 py-2 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm">
                    {repositoriesError}
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={repository}
                      onChange={(e) => setRepository(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
                    >
                      <option value="">Select a repository</option>
                      {repositories.map((repo) => (
                        <option key={repo.id} value={repo.full_name}>
                          {repo.full_name}{" "}
                          {repo.private ? "(private)" : "(public)"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 p-6 overflow-hidden">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workflow Content (YAML)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none overflow-y-auto"
            placeholder="Enter your GitHub Actions workflow YAML here..."
          />
        </div>
      </div>
    </div>
  );
};

export default WorkflowEditorModal;
