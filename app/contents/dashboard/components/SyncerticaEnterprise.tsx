"use client";

import React, { useState } from "react";
import {
  Plus,
  MessageSquare,
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
import RealtimeNotifications from "./RealtimeNotifications";
import DataVisualizationDashboard from "./DataVisualizationDashboard";
import SecurityDashboard from "./SecurityDashboard";
import AIAssistant from "./AIAssistant";
import TaskManager from "./TaskManager";
import DevOpsPipeline from "./DevOpsPipeline";
import InfrastructureAsCode from "./InfrastructureAsCode";
import CallChatModal from "./CallChatModal";
import ProfileDropdown from "./ProfileDropdown";

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
  User,
} from "../../../shared/types/dashboard";

interface SyncerticaEnterpriseProps {
  user: User;
  onLogout: () => void;
}

const SyncerticaEnterprise: React.FC<SyncerticaEnterpriseProps> = ({
  user,
  onLogout,
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [showCallChat, setShowCallChat] = useState(false);

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
    {
      name: "Call/Chat",
      icon: MessageSquare,
      action: () => setShowCallChat(true),
    },
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
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <Toolbar toolbarItems={toolbarItems} />
          <div className="flex items-center gap-2">
            <RealtimeNotifications />
            <ProfileDropdown user={user} onLogout={onLogout} />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 relative dashboard-content">
          {/* Render specific components for different sections */}
          {activeSection === "overview" ? (
            <DataVisualizationDashboard />
          ) : activeSection === "security" ? (
            <SecurityDashboard />
          ) : activeSection === "tasks" ? (
            <TaskManager />
          ) : activeSection === "devops" ? (
            <DevOpsPipeline />
          ) : activeSection === "infrastructure" ? (
            <InfrastructureAsCode />
          ) : (
            /* Default dashboard blocks for other sections */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardBlocks[activeSection]?.map((block) => (
                <DashboardBlock key={block.id} block={block} />
              ))}
            </div>
          )}

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

      {/* Floating AI Assistant */}
      <AIAssistant
        isOpen={aiAssistantOpen}
        onToggle={() => setAiAssistantOpen(!aiAssistantOpen)}
      />

      {/* Call/Chat Modal */}
      <CallChatModal
        isOpen={showCallChat}
        onClose={() => setShowCallChat(false)}
        currentUser={user}
      />
    </div>
  );
};

export default SyncerticaEnterprise;
