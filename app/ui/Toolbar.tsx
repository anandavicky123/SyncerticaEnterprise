import React from "react";
import { ToolbarItem } from "../shared/types/dashboard";
import Tooltip from "./Tooltip";

interface ToolbarProps {
  toolbarItems: ToolbarItem[];
  onRepositoriesClick: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  toolbarItems,
  onRepositoriesClick,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-2 py-2 w-full">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-w-0 w-full">
        {toolbarItems.map((tool, index) => (
          <Tooltip
            key={index}
            content={
              tool.disabled
                ? `${tool.name} - Only available in Overview, Sales, and Workers sections`
                : `${tool.name} - Click to ${tool.name.toLowerCase()}`
            }
          >
            <button
              onClick={tool.disabled ? undefined : tool.action}
              disabled={tool.disabled}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                tool.disabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <tool.icon className="w-4 h-4" />
              <span>{tool.name}</span>
            </button>
          </Tooltip>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Tooltip content="Repositories">
            <button
              onClick={onRepositoriesClick}
              className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <span>Repositories</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
