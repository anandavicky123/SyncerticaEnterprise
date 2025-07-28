import React from "react";
import { Filter, Download } from "lucide-react";
import { ToolbarItem } from "../../../shared/types/dashboard";
import Tooltip from "./Tooltip";

interface ToolbarProps {
  toolbarItems: ToolbarItem[];
}

const Toolbar: React.FC<ToolbarProps> = ({ toolbarItems }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-2">
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
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
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
          <Tooltip content="Filter dashboard data">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </Tooltip>
          <Tooltip content="Export dashboard data">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Download className="w-4 h-4 text-gray-600" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
