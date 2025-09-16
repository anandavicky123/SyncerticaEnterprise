import React, { useState, useRef, useEffect } from "react";
import { ToolbarItem } from "../shared/types/dashboard";
import { ChevronDown } from "lucide-react";
import Tooltip from "./Tooltip";

interface DropdownItem {
  label: string;
  action: () => void;
  disabled?: boolean;
}

interface ExtendedToolbarItem extends Omit<ToolbarItem, "action"> {
  action?: () => void;
  dropdown?: DropdownItem[];
}

interface ToolbarProps {
  toolbarItems: ExtendedToolbarItem[];
}

const Toolbar: React.FC<ToolbarProps> = ({ toolbarItems }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isClickInsideAnyDropdown = Object.values(dropdownRefs.current).some(
        (ref) => ref && ref.contains(event.target as Node)
      );

      if (!isClickInsideAnyDropdown) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = (itemName: string) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-2 py-2 w-full">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-w-0 w-full">
        {toolbarItems.map((tool, index) => (
          <div
            key={index}
            className="relative"
            ref={(el) => {
              dropdownRefs.current[tool.name] = el;
            }}
          >
            <Tooltip
              content={
                tool.disabled
                  ? `${tool.name} - Only available in Overview, Sales, and Workers sections`
                  : `${tool.name} - Click to ${tool.name.toLowerCase()}`
              }
            >
              <button
                onClick={
                  tool.dropdown
                    ? () => handleDropdownToggle(tool.name)
                    : tool.disabled
                    ? undefined
                    : tool.action
                }
                disabled={tool.disabled && !tool.dropdown}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${
                  tool.disabled && !tool.dropdown
                    ? "text-gray-400 cursor-not-allowed"
                    : tool.dropdown
                    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <tool.icon className="w-4 h-4" />
                <span>{tool.name}</span>
                {tool.dropdown && <ChevronDown className="w-3 h-3" />}
              </button>
            </Tooltip>

            {/* Floating Dropdown */}
            {tool.dropdown && activeDropdown === tool.name && (
              <div className="fixed top-auto left-auto mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {tool.dropdown.map((item, dropdownIndex) => (
                    <button
                      key={dropdownIndex}
                      onClick={() => {
                        if (!item.disabled) {
                          item.action();
                          setActiveDropdown(null);
                        }
                      }}
                      disabled={item.disabled}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        item.disabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
