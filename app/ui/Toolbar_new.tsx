import React from "react";
import { Download, GitBranch } from "lucide-react";
import { ToolbarItem } from "../shared/types/dashboard";
import { useLocalization } from "../shared/localization";
import Tooltip from "./Tooltip";

interface ToolbarProps {
  toolbarItems: ToolbarItem[];
  onRepositoriesClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  toolbarItems,
  onRepositoriesClick,
}) => {
  const { t } = useLocalization();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 p-2">
      <div className="flex items-center overflow-x-auto scroll-smooth">
        <div className="flex items-center gap-2 min-w-0">
          {/* File operations */}
          <Tooltip content={t("toolbar.view")}>
            <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border dark:border-gray-600 flex items-center gap-1.5 whitespace-nowrap">
              {t("toolbar.view")}
            </button>
          </Tooltip>

          <Tooltip content={t("toolbar.edit")}>
            <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border dark:border-gray-600 flex items-center gap-1.5 whitespace-nowrap">
              {t("toolbar.edit")}
            </button>
          </Tooltip>

          <Tooltip content={t("toolbar.repositories")}>
            <button
              onClick={onRepositoriesClick}
              className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700 rounded border border-blue-300 dark:border-blue-600 flex items-center gap-1.5 whitespace-nowrap"
            >
              <GitBranch className="w-4 h-4" />
              {t("toolbar.repositories")}
            </button>
          </Tooltip>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Export button */}
          <Tooltip content={t("toolbar.export")}>
            <button className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-700 rounded border border-green-300 dark:border-green-600 flex items-center gap-1.5 whitespace-nowrap">
              <Download className="w-4 h-4" />
              {t("toolbar.export")}
            </button>
          </Tooltip>

          {/* Toolbar items */}
          {toolbarItems.map((tool, index) => (
            <Tooltip
              key={index}
              content={
                tool.disabled
                  ? `${tool.name} - ${t("toolbar.onlyAvailable")}`
                  : `${tool.name} - ${t(
                      "toolbar.clickTo"
                    )} ${tool.name.toLowerCase()}`
              }
            >
              <button
                onClick={tool.disabled ? undefined : tool.action}
                disabled={tool.disabled}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                  tool.disabled
                    ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <tool.icon className="w-4 h-4" />
                <span>{tool.name}</span>
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
