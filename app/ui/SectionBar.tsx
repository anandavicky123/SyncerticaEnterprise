import React from "react";
import { Section } from "../shared/types/dashboard";

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
    <div className="bg-white border-b border-gray-200 px-2 py-2 w-full">
      <div className="flex items-center w-full">
        <div
          className="flex items-center gap-4 overflow-x-auto w-full 
            scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 
            lg:justify-evenly lg:overflow-x-visible"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`flex-grow flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 min-w-max ${
                activeSection === section.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span>{section.icon}</span>
              <span className="font-medium">{section.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionBar;
