"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  StickyNote,
  Calendar,
  Folder,
  Wrench,
} from "lucide-react";

// Components
import Sidebar from "./Sidebar";
import SectionBar from "./SectionBar";
import Toolbar from "./Toolbar";
import DashboardBlockComponent from "./DashboardBlock";
import StickyNoteComponent from "./StickyNoteComponent";
import AddNoteModal from "./AddNoteModal";
import RealtimeNotifications from "./RealtimeNotifications";
import DataVisualizationDashboard from "../contents/DataVisualizationDashboard";
import SecurityDashboard from "../contents/SecurityDashboard";
import AIAssistant from "../contents/AIAssistant";
import TaskManager from "../contents/TaskManager";
import Projects from "../contents/Projects";
import WorkersManagement from "../contents/WorkersManagement";
import CallChatModal from "./CallChatModal";
import ProfileDropdown from "./ProfileDropdown";
import CalendarModal from "./CalendarModal";
import WorkflowEditorModal from "./WorkflowEditorModal";
import InfrastructureEditorModal from "./InfrastructureEditorModal";
import ContainerEditorModal from "./ContainerEditorModal";

// Hooks
import { useStickyNotes } from "../hooks/useStickyNotes";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useGitHubData } from "../hooks/useGitHubData";

// Constants and Types
import {
  sections,
  sidebarItems,
  dashboardBlocks,
} from "../shared/constants/dashboardData";
import { StickyNote as StickyNoteType, User } from "../shared/types/dashboard";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [showCallChat, setShowCallChat] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // DevOps modals
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showInfrastructureEditor, setShowInfrastructureEditor] =
    useState(false);
  const [showContainerEditor, setShowContainerEditor] = useState(false);

  const {
    addStickyNote,
    toggleChecklistItem,
    removeStickyNote,
    updateNotePosition,
  } = useStickyNotes(stickyNotes, setStickyNotes);

  const { draggedNote, handleMouseDown } = useDragAndDrop(updateNotePosition);
  const {
    connectionStatus,
    connectToGitHub,
    disconnectFromGitHub,
    refreshData,
  } = useGitHubData();

  const toolbarItems = [
    { name: "Add Note", icon: StickyNote, action: () => setShowAddNote(true) },
    {
      name: "Call/Chat",
      icon: MessageSquare,
      action: () => setShowCallChat(true),
    },
    { name: "Calendar", icon: Calendar, action: () => setShowCalendar(true) },
    {
      name: "Repository",
      icon: Folder,
      dropdown: [
        {
          label: "Connect to GitHub",
          action: connectToGitHub,
          disabled: connectionStatus.connected,
        },
        {
          label: "Refresh",
          action: () => {
            console.log("🔄 Toolbar Refresh clicked");
            refreshData();
          },
        },
        {
          label: "Disconnect",
          action: () => {
            console.log("🔌 Toolbar Disconnect clicked");
            disconnectFromGitHub();
          },
          disabled: !connectionStatus.connected,
        },
      ],
    },
    {
      name: "DevOps Tools",
      icon: Wrench,
      dropdown: [
        {
          label: "Add Workflow",
          action: () => {
            console.log("Add workflow clicked");
            setShowWorkflowEditor(true);
          },
        },
        {
          label: "Add Infrastructure",
          action: () => {
            console.log("Add infrastructure clicked");
            setShowInfrastructureEditor(true);
          },
        },
        {
          label: "Add Container",
          action: () => {
            console.log("Add container clicked");
            setShowContainerEditor(true);
          },
        },
      ],
    },
  ];

  const handleAddNote = (content: string, type: "text" | "checklist") => {
    addStickyNote(content, type);
    setShowAddNote(false);
  };

  // DevOps modal handlers
  const handleSaveWorkflow = async (
    content: string,
    filename?: string,
    repository?: string
  ) => {
    try {
      console.log("Saving workflow:", { content, filename, repository });
      alert(
        "Workflow created successfully! (Note: This is a demo - actual GitHub integration would save to repository)"
      );
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert("Failed to save workflow. Please try again.");
    }
  };

  const handleSaveInfrastructure = async (
    content: string,
    filename?: string,
    repository?: string,
    type?: string
  ) => {
    try {
      console.log("Saving infrastructure:", {
        content,
        filename,
        repository,
        type,
      });
      alert(
        "Infrastructure created successfully! (Note: This is a demo - actual GitHub integration would save to repository)"
      );
    } catch (error) {
      console.error("Error saving infrastructure:", error);
      alert("Failed to save infrastructure. Please try again.");
    }
  };

  const handleSaveContainer = async (
    content: string,
    filename?: string,
    repository?: string,
    type?: string
  ) => {
    try {
      console.log("Saving container:", { content, filename, repository, type });
      alert(
        "Container configuration created successfully! (Note: This is a demo - actual GitHub integration would save to repository)"
      );
    } catch (error) {
      console.error("Error saving container:", error);
      alert("Failed to save container. Please try again.");
    }
  };

  const getAllBlocks = (section: string) => {
    return dashboardBlocks[section] || [];
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
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
        <div className="border-b border-gray-200 dark:border-gray-600 p-4 flex items-center justify-between bg-white dark:bg-gray-800">
          <div className="flex-1 min-w-0">
            <Toolbar toolbarItems={toolbarItems} />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <RealtimeNotifications />
            <ProfileDropdown user={user} onLogout={onLogout} />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 relative dashboard-content bg-gray-50 dark:bg-gray-900">
          {/* Render specific components for different sections */}
          {activeSection === "overview" ? (
            <DataVisualizationDashboard />
          ) : activeSection === "security" ? (
            <SecurityDashboard />
          ) : activeSection === "tasks" ? (
            <TaskManager />
          ) : activeSection === "projects" ? (
            <Projects />
          ) : activeSection === "workers" ? (
            <WorkersManagement />
          ) : (
            /* Default dashboard blocks for other sections */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAllBlocks(activeSection).map((block) => (
                <DashboardBlockComponent key={block.id} block={block} />
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

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
      />

      {/* DevOps Tool Modals */}
      <WorkflowEditorModal
        isOpen={showWorkflowEditor}
        onClose={() => setShowWorkflowEditor(false)}
        workflow={null}
        mode="create"
        onSave={handleSaveWorkflow}
      />

      <InfrastructureEditorModal
        isOpen={showInfrastructureEditor}
        onClose={() => setShowInfrastructureEditor(false)}
        infrastructure={null}
        mode="create"
        onSave={handleSaveInfrastructure}
      />

      <ContainerEditorModal
        isOpen={showContainerEditor}
        onClose={() => setShowContainerEditor(false)}
        container={null}
        mode="create"
        onSave={handleSaveContainer}
      />
    </div>
  );
};

export default Dashboard;
