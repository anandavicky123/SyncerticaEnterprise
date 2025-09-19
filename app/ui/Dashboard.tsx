"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  StickyNote,
  Calendar,
  Folder,
  Wrench,
  Users,
  CheckSquare,
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
import TaskManager from "../contents/TaskManager";
import Projects from "../contents/Projects";
import WorkersManagement from "../workers/management";
import CallChatModal from "./CallChatModal";
import ProfileDropdown from "./ProfileDropdown";
import CalendarModal from "./CalendarModal";
import WorkflowEditorModal from "./WorkflowEditorModal";
import InfrastructureEditorModal from "./InfrastructureEditorModal";
import ContainerEditorModal from "./ContainerEditorModal";
import CreateTaskModal from "./CreateTaskModal";
import AddWorkerModal from "./AddWorkerModal";

// Hooks
import { useStickyNotes } from "../hooks/useStickyNotes";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { useGitHubData } from "../hooks/useGitHubData";

// Constants and Types
import { sections, dashboardBlocks } from "../shared/constants/dashboardData";
import {
  StickyNote as StickyNoteType,
  User,
  SidebarSection,
} from "../shared/types/dashboard";
import {
  getDatabaseStats,
  generateDynamicSidebarItems,
} from "../../lib/sidebar-stats-client";
import { getGitHubAppInstallUrl } from "../../lib/github-app-client";

interface DashboardProps {
  user: User;
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout = () => {} }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showCallChat, setShowCallChat] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentManagerUUID, setCurrentManagerUUID] = useState<string>("");

  // Fetch current user session to get their device UUID
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });
      if (response.ok) {
        const sessionData = await response.json();
        if (sessionData.success && sessionData.session?.actorId) {
          setCurrentManagerUUID(sessionData.session.actorId);
          console.log(
            "✅ Dashboard - Current manager UUID:",
            sessionData.session.actorId
          );
        }
      }
    } catch (error) {
      console.error("Dashboard - Error fetching current user session:", error);
      // Keep using the default UUID as fallback
    }
  };

  // Fetch current user session when component mounts
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Dynamic sidebar items based on database statistics
  const [sidebarItems, setSidebarItems] = useState<SidebarSection[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // DevOps modals
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showInfrastructureEditor, setShowInfrastructureEditor] =
    useState(false);
  const [showContainerEditor, setShowContainerEditor] = useState(false);

  // Task and Worker modals
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);

  // Sticky notes helpers
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

  // Function to update sidebar statistics from database
  const updateSidebarStats = async (managerUUID?: string) => {
    try {
      if (!managerUUID) {
        console.warn(
          "updateSidebarStats called without managerUUID - skipping update"
        );
        return;
      }

      setStatsLoading(true);
      console.debug("updateSidebarStats - requesting stats for:", managerUUID);
      const stats = await getDatabaseStats(managerUUID);
      console.debug("updateSidebarStats - received stats:", stats);
      const dynamicItems = generateDynamicSidebarItems(stats);
      setSidebarItems(dynamicItems);
    } catch (error) {
      console.error("Error fetching sidebar statistics:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Update stats when component mounts
  useEffect(() => {
    // No-op: stats will be fetched once currentManagerUUID is set by session fetch
  }, []);

  // When manager UUID is discovered/changed, refresh stats using it
  useEffect(() => {
    if (currentManagerUUID) {
      updateSidebarStats(currentManagerUUID);
    }
  }, [currentManagerUUID]);

  // Listen for global stats-change events so other components can trigger a refresh
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail as
          | { managerUUID?: string }
          | undefined;
        const m = detail?.managerUUID || currentManagerUUID;
        if (m) updateSidebarStats(m);
      } catch (err) {
        console.error("Error handling stats-change event:", err);
      }
    };

    window.addEventListener(
      "syncertica:stats-changed",
      handler as EventListener
    );
    return () => {
      window.removeEventListener(
        "syncertica:stats-changed",
        handler as EventListener
      );
    };
  }, [currentManagerUUID]);

  // Update stats when tasks or workers change (can be triggered by modals)

  const toolbarItems = [
    { name: "Add Note", icon: StickyNote, action: () => setShowAddNote(true) },
    {
      name: "Call/Chat",
      icon: MessageSquare,
      action: () => setShowCallChat(true),
    },
    { name: "Calendar", icon: Calendar, action: () => setShowCalendar(true) },
    {
      name: "Task Management",
      icon: CheckSquare,
      dropdown: [
        {
          label: "Create Task",
          action: () => setShowCreateTask(true),
        },
      ],
    },
    {
      name: "Workers",
      icon: Users,
      dropdown: [
        {
          label: "Add Worker",
          action: () => setShowAddWorker(true),
        },
      ],
    },
    {
      name: "Repository",
      icon: Folder,
      dropdown: [
        {
          label: "Connect to GitHub",
          // Projects page opens the GitHub App install URL; mimic that here so behavior is consistent
          action: () => window.open(getGitHubAppInstallUrl(), "_blank"),
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
          // Projects page uses redirect to /api/github/disconnect which sets cookies and redirects.
          // Use the same redirect so disconnect behavior matches the Projects UI.
          action: () => {
            console.log("🔌 Toolbar Disconnect clicked");
            window.location.href = "/api/github/disconnect";
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
    if (!repository) {
      alert("Please select a repository");
      return;
    }

    try {
      console.log("Saving workflow to GitHub:", { filename, repository });

      const response = await fetch("/api/workflows/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          filename,
          repository,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Emit optimistic-create event so UI lists can update instantly
        try {
          const createdItem: Record<string, unknown> = {
            type: "workflow",
            repository: repository,
            filename: result.file.path.split("/").pop(),
            path: result.file.path,
            id: result.file.sha || `${repository}/${result.file.path}`,
            name: filename || result.file.path,
          };
          window.dispatchEvent(
            new CustomEvent("syncertica:github-item-created", {
              detail: createdItem,
            })
          );
        } catch {
          /* ignore event dispatch errors */
        }

        // Start background refresh (don't await) and show success notification
        // asynchronously so the modal can close immediately when this function resolves.
        refreshData().catch(() => {
          /* ignore background refresh errors */
        });

        setTimeout(() => {
          alert(
            `${result.message}\n\nFile saved to: ${result.file.path}\nView on GitHub: ${result.file.url}`
          );
        }, 0);
      } else {
        throw new Error(
          `Failed to save workflow: ${result.error}${
            result.details ? "\n" + result.details : ""
          }`
        );
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(
          "Failed to save workflow. Please check your connection and try again."
        );
      }
      throw error; // Re-throw so modal can handle it
    }
  };

  // Task and Worker handlers
  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    assignedTo: string;
    managerdeviceuuid: string;
    priority: string;
    dueDate?: string;
    estimatedHours?: number;
    tags: string[];
  }) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const newTask = await response.json();
        console.log("✅ Task created successfully:", newTask);
        alert("Task created successfully!");
        // Refresh sidebar statistics after successful task creation
        await updateSidebarStats(currentManagerUUID);
      } else {
        throw new Error("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  const handleAddWorker = async (workerData: {
    name: string;
    pronouns: string | null;
    jobRole: "UI/UX Designer" | "Developer" | "Manager" | "QA";
    email: string;
    password?: string;
  }) => {
    try {
      const response = await fetch("/api/workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workerData),
      });

      if (response.ok) {
        const newWorker = await response.json();
        console.log("✅ Worker added successfully:", newWorker);
        alert("Worker added successfully!");
        // Refresh sidebar statistics after successful worker addition
        await updateSidebarStats(currentManagerUUID);
      } else {
        throw new Error("Failed to add worker");
      }
    } catch (error) {
      console.error("Error adding worker:", error);
      throw error;
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
        statsLoading={statsLoading}
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
            <DataVisualizationDashboard />
          ) : activeSection === "tasks" ? (
            <TaskManager />
          ) : activeSection === "projects" ? (
            <Projects
              onOpenWorkflowEditor={() => setShowWorkflowEditor(true)}
              onOpenInfrastructureEditor={() =>
                setShowInfrastructureEditor(true)
              }
              onOpenContainerEditor={() => setShowContainerEditor(true)}
            />
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
        item={null}
        onSaved={async () => {
          try {
            const createdItem: Record<string, unknown> = {
              type: "infrastructure",
              repository: undefined,
              path: undefined,
              id: undefined,
              name: undefined,
            };
            window.dispatchEvent(
              new CustomEvent("syncertica:github-item-created", {
                detail: createdItem,
              })
            );
          } catch {}
          // Start background refresh and close modal immediately so UI doesn't stay stuck
          refreshData().catch(() => {});
          setShowInfrastructureEditor(false);
        }}
      />

      <ContainerEditorModal
        isOpen={showContainerEditor}
        onClose={() => setShowContainerEditor(false)}
        item={null}
        onSaved={async () => {
          try {
            const createdItem: Record<string, unknown> = {
              type: "container",
              repository: undefined,
              path: undefined,
              id: undefined,
              name: undefined,
            };
            window.dispatchEvent(
              new CustomEvent("syncertica:github-item-created", {
                detail: createdItem,
              })
            );
          } catch {}
          // Start background refresh and close modal immediately so UI doesn't stay stuck
          refreshData().catch(() => {});
          setShowContainerEditor(false);
        }}
      />

      {/* Task and Worker Modals */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreateTask={handleCreateTask}
        currentUserId={currentManagerUUID}
      />

      <AddWorkerModal
        isOpen={showAddWorker}
        onClose={() => setShowAddWorker(false)}
        onAddWorker={handleAddWorker}
      />
    </div>
  );
};

export default Dashboard;
