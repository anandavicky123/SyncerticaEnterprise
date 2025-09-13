import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarSection } from "../shared/types/dashboard";

interface SidebarProps {
  expanded: boolean;
  onToggle: () => void;
  sidebarItems: SidebarSection[];
  statsLoading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  expanded,
  onToggle,
  sidebarItems,
  statsLoading = false,
}) => {
  return (
    <div
      className={`${
        expanded ? "w-72" : "w-16"
      } transition-all duration-300 bg-gray-900 dark:bg-gray-950 text-white flex flex-col`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-700 dark:border-gray-600">
        <div className="flex items-center justify-between">
          {expanded && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-semibold">Syncertica Enterprise</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-700 dark:hover:bg-gray-800 rounded"
          >
            {expanded ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {sidebarItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3
                className={`text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 ${
                  !expanded ? "text-center" : ""
                }`}
              >
                {expanded ? section.title : section.title.charAt(0)}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <div
                      className={`flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 cursor-pointer ${
                        !expanded ? "justify-center" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{item.icon}</span>
                        {expanded && (
                          <span className="text-sm">{item.name}</span>
                        )}
                      </div>
                      {expanded && item.count !== undefined && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {item.count}
                        </span>
                      )}
                    </div>
                    {expanded && item.subitems && (
                      <div className="ml-6 space-y-1">
                        {item.subitems.map((subitem, subIndex) => (
                          <div
                            key={subIndex}
                            className="flex items-center justify-between py-1 px-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm">{subitem.icon}</span>
                              <span className="text-sm">{subitem.name}</span>
                            </div>
                            {subitem.count !== undefined && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {subitem.count}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Centered loading overlay (shown when statsLoading is true) */}
      {statsLoading && (
        <div
          aria-live="polite"
          className={`absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none ${
            expanded ? "w-72" : "w-16"
          }`}
        >
          <div className="bg-black/60 dark:bg-white/10 backdrop-blur-sm rounded px-3 py-2">
            <div className="text-xs text-gray-300 dark:text-gray-200 text-center">
              Loading stats...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
