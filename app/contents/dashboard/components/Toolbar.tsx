import React from "react";
import { Filter, Download } from "lucide-react";
import { ToolbarItem } from "../../../shared/types/dashboard";

interface ToolbarProps {
  toolbarItems: ToolbarItem[];
}

const Toolbar: React.FC<ToolbarProps> = ({ toolbarItems }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-2">
        {toolbarItems.map((tool, index) => (
          <button
            key={index}
            onClick={tool.action}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <tool.icon className="w-4 h-4" />
            <span>{tool.name}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Download className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
