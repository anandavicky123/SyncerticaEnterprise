"use client";

import React, { useState } from "react";
import {
  Plus,
  MessageCircle,
  Phone,
  StickyNote,
  BarChart3,
  Calendar,
  File,
  Zap,
} from "lucide-react";

// Components
import Sidebar from "./Sidebar";
import SectionBar from "./SectionBar";
import Toolbar from "./Toolbar";
import DashboardBlock from "./DashboardBlock";
import StickyNoteComponent from "./StickyNoteComponent";
import AddNoteModal from "./AddNoteModal";

// Hooks
import { useStickyNotes } from "../hooks/useStickyNotes";
import { useDragAndDrop } from "../hooks/useDragAndDrop";

// Constants and Types
import {
  sections,
  sidebarItems,
  dashboardBlocks,
} from "../../../shared/constants/dashboardData";
import {
  ToolbarItem,
  StickyNote as StickyNoteType,
} from "../../../shared/types/dashboard";

const SyncerticaEnterprise: React.FC = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);

  const {
    addStickyNote,
    toggleChecklistItem,
    removeStickyNote,
    updateNotePosition,
  } = useStickyNotes(stickyNotes, setStickyNotes);

  const { draggedNote, handleMouseDown } = useDragAndDrop(updateNotePosition);

  const toolbarItems: ToolbarItem[] = [
    { name: "Add Block", icon: Plus, action: () => {} },
    { name: "Add Note", icon: StickyNote, action: () => setShowAddNote(true) },
    { name: "Chat", icon: MessageCircle, action: () => {} },
    { name: "Call", icon: Phone, action: () => {} },
    { name: "Analytics", icon: BarChart3, action: () => {} },
    { name: "Calendar", icon: Calendar, action: () => {} },
    { name: "Files", icon: File, action: () => {} },
    { name: "Automation", icon: Zap, action: () => {} },
  ];

  const handleAddNote = (content: string, type: "text" | "checklist") => {
    addStickyNote(content, type);
    setShowAddNote(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        sidebarItems={sidebarItems}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Section Bar */}
        <SectionBar
          sections={sections}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Toolbar */}
        <Toolbar toolbarItems={toolbarItems} />

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 relative dashboard-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardBlocks[activeSection]?.map((block) => (
              <DashboardBlock key={block.id} block={block} />
            ))}
          </div>

          {/* Sticky Notes */}
          {stickyNotes.map((note) => (
            <StickyNoteComponent
              key={note.id}
              note={note}
              isDragging={draggedNote === note.id}
              onMouseDown={handleMouseDown}
              onRemove={removeStickyNote}
              onToggleChecklistItem={toggleChecklistItem}
            />
          ))}

          {/* Add Note Modal */}
          <AddNoteModal
            isOpen={showAddNote}
            onClose={() => setShowAddNote(false)}
            onAddNote={handleAddNote}
          />
        </div>
      </div>
    </div>
  );
};

export default SyncerticaEnterprise;
