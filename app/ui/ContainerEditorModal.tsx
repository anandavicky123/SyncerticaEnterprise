"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Save, Package, ChevronDown } from "lucide-react";
import { useRepositories } from "../hooks/useRepositories";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: {
    id: string;
    name: string;
    repository: string;
    path: string;
    content?: string;
  } | null;
  onSaved?: () => void;
}

const ContainerEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  onSaved,
}) => {
  const { repositories = [], loading: reposLoading } = useRepositories();
  const [content, setContent] = useState<string>(
    item?.content ||
      `# Container Configuration
# This is a template for container configuration
# Replace this with your actual container configuration

# Example Dockerfile:
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
`
  );
  const [sha, setSha] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState<string>(item?.path || "");
  // Repository selection states for create mode
  const [repository, setRepository] = useState<string>(item?.repository || "");
  const [useCustomRepo, setUseCustomRepo] = useState<boolean>(false);

  const isCreate = useMemo(() => !item, [item]);

  useEffect(() => {
    if (item) {
      setContent(item.content || "");
      setFileName(item.path || "");
      setRepository(item.repository || "");
      setUseCustomRepo(false);
    } else {
      // Reset for new item
      setContent(`# Container Configuration
# This is a template for container configuration
# Replace this with your actual container configuration

# Example Dockerfile:
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
`);
      setFileName("");
      setRepository("");
      setUseCustomRepo(false);
    }
    setSha(undefined);
    if (isOpen && item) {
      (async () => {
        try {
          const res = await fetch(
            `/api/github/contents?repo=${encodeURIComponent(
              item.repository
            )}&path=${encodeURIComponent(item.path)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.content) {
              const decoded = atob(data.content.replace(/\n/g, ""));
              setContent(decoded);
            }
            setSha(data.sha);
          }
        } catch (e) {
          console.error("Failed to load content", e);
        }
      })();
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Resolve repo/path for create vs edit
    const finalRepo = item ? item.repository : repository.trim();
    const finalPath = item ? item.path : fileName.trim();

    if (!finalRepo || !finalPath) {
      alert("Repository and file path are required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/github/contents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: finalRepo,
          path: finalPath,
          content: btoa(content),
          sha: item ? sha : undefined, // Only include sha for existing files
          message: item
            ? `chore(container): update ${finalPath}`
            : `feat(container): add ${finalPath}`,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        alert(`Failed to save: ${res.status} ${t}`);
        return;
      }
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const repoIsInvalid = isCreate && !repository.trim();
  const pathIsInvalid = isCreate && !fileName.trim();
  const saveDisabled = saving || (isCreate && (repoIsInvalid || pathIsInvalid));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {isCreate ? "Create Container" : "Edit Container"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Preview removed */}
            <button
              onClick={handleSave}
              disabled={saveDisabled}
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

        {/* Create mode fields */}
        {isCreate && (
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Dockerfile or docker-compose.yml"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Files will be created at the repository root.
                </p>
                {pathIsInvalid && (
                  <p className="mt-1 text-xs text-red-600">
                    Filename is required.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository
                </label>
                {reposLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Loading repositories...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={useCustomRepo ? "custom" : repository}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "custom") {
                          setUseCustomRepo(true);
                          setRepository("");
                        } else {
                          setUseCustomRepo(false);
                          setRepository(v);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none pr-10 bg-white"
                    >
                      <option value="">Select a repository</option>
                      {repositories.map((repo) => (
                        <option key={repo.id} value={repo.full_name}>
                          {repo.full_name}{" "}
                          {repo.private ? "(private)" : "(public)"}
                        </option>
                      ))}
                      <option value="custom">Custom Repository</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
                {useCustomRepo && (
                  <input
                    type="text"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="owner/repository-name"
                    value={repository}
                    onChange={(e) => setRepository(e.target.value)}
                  />
                )}
                {repoIsInvalid && (
                  <p className="mt-1 text-xs text-red-600">
                    Repository is required.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 p-6 overflow-hidden">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Container Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-none overflow-y-auto"
            placeholder="Enter your Dockerfile or container configuration here..."
          />
        </div>
      </div>
    </div>
  );
};

export default ContainerEditorModal;
