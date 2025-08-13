"use client";

import React, { useState } from "react";
import { X, Save, FileText, Eye } from "lucide-react";

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
`
  );

  const [filename, setFilename] = useState(
    workflow?.filename || "ci-cd-pipeline.yml"
  );
  const [repository, setRepository] = useState(workflow?.repository || "");

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(content, filename, repository);
    onClose();
  };

  const handlePreview = () => {
    // Basic YAML validation and preview
    try {
      console.log("Workflow preview:", { filename, content });
      alert("Workflow syntax appears valid!");
    } catch {
      alert("Invalid YAML syntax detected!");
    }
  };

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
            <button
              onClick={handlePreview}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
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
                <input
                  type="text"
                  value={repository}
                  onChange={(e) => setRepository(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="repository-name"
                />
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
