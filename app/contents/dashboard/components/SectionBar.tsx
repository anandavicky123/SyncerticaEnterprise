import React from "react";
import { Bell, Search } from "lucide-react";
import { Section } from "../../../shared/types/dashboard";
import Tooltip from "./Tooltip";

interface SectionBarProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

const SectionBar: React.FC<SectionBarProps> = ({
  sections,
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {sections.map((section) => (
            <Tooltip
              key={section.id}
              content={`Switch to ${section.name} dashboard`}
            >
              <button
                onClick={() => onSectionChange(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span>{section.icon}</span>
                <span className="font-medium">{section.name}</span>
              </button>
            </Tooltip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="View all notifications">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
          </Tooltip>
          <Tooltip content="Search dashboard">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default SectionBar;
