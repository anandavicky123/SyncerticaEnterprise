import React, { useState } from "react";
import { X, Github, GitBranch, CheckCircle } from "lucide-react";
import { useLocalization } from "../shared/localization";

interface RepositoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Repository {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  color: string;
}

const RepositoriesModal: React.FC<RepositoriesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLocalization();
  const [repositories, setRepositories] = useState<Repository[]>([
    {
      id: "github",
      name: "GitHub",
      icon: <Github className="w-6 h-6" />,
      connected: false,
      color: "gray",
    },
    {
      id: "bitbucket",
      name: "BitBucket",
      icon: (
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
          BB
        </div>
      ),
      connected: false,
      color: "blue",
    },
    {
      id: "gitlab",
      name: "GitLab",
      icon: <GitBranch className="w-6 h-6" />,
      connected: false,
      color: "orange",
    },
  ]);

  const toggleConnection = (id: string) => {
    setRepositories((prev) =>
      prev.map((repo) =>
        repo.id === id ? { ...repo, connected: !repo.connected } : repo
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("connectRepositories")}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`text-${repo.color}-500`}>{repo.icon}</div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {repo.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {repo.connected && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <button
                  onClick={() => toggleConnection(repo.id)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    repo.connected
                      ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {repo.connected ? "Disconnect" : t("connect")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          {t("connected")}: {repositories.filter((r) => r.connected).length}/
          {repositories.length}
        </div>
      </div>
    </div>
  );
};

export default RepositoriesModal;
