"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  MessageSquare,
  Phone,
  Edit,
  User,
  Users,
  Code,
  Palette,
  Shield,
  Settings,
} from "lucide-react";
import CallChatModal from "../ui/CallChatModal";
import AddWorkerModal from "../ui/AddWorkerModal";
import { useToast } from "../shared/contexts/ToastContext";

interface Worker {
  id: string;
  managerDeviceUUID: string;
  name: string;
  pronouns: string | null;
  jobRole: "UI/UX Designer" | "Developer" | "Manager" | "QA";
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkersManagementProps {
  className?: string;
}

export default function WorkersManagement({
  className = "",
}: WorkersManagementProps) {
  const { showToast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCallChat, setShowCallChat] = useState(false);
  const [modalMemberId, setModalMemberId] = useState<string | undefined>(
    undefined
  );
  const [modalMode, setModalMode] = useState<"chat" | "call">("chat");
  const [managerProfile, setManagerProfile] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await fetch("/api/workers", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          showToast({
            message: "Your session has expired. Please log in again.",
            type: "error",
          });
          window.location.href = "/login";
          return;
        }
        throw new Error(data.error || "Failed to fetch workers");
      }

      setWorkers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching workers:", error);
      if (error instanceof SyntaxError) {
        window.location.href = "/login";
        return;
      }
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorMessage(message);
      showToast({
        message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Load manager profile for passing into CallChatModal (optional)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/manager/profile", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setManagerProfile({
          id: data.id || "manager",
          name: data.name,
          email: data.email,
        });
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleAddWorker = async (workerData: {
    name: string;
    pronouns: string | null;
    jobRole: Worker["jobRole"];
    email: string;
    password?: string;
  }) => {
    try {
      const sessionResponse = await fetch("/api/auth/session", {
        credentials: "include",
      });
      const sessionData = await sessionResponse.json();

      if (!sessionData || !sessionData.isLoggedIn) {
        showToast({
          message: "Your session has expired. Please log in again.",
          type: "error",
        });
        window.location.href = "/login";
        return;
      }

      if (editingWorker) {
        const response = await fetch(`/api/workers/${editingWorker.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            id: editingWorker.id,
            name: workerData.name,
            pronouns: workerData.pronouns,
            jobRole: workerData.jobRole,
            email: workerData.email,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            showToast({
              message: "Your session has expired. Please log in again.",
              type: "error",
            });
            window.location.href = "/login";
            return;
          }
          throw new Error(data.error || "Failed to update worker");
        }

        setWorkers((prev) =>
          prev.map((worker) => (worker.id === editingWorker.id ? data : worker))
        );
        setEditingWorker(null);
        setErrorMessage(null);
        showToast({
          message: "Worker updated successfully",
          type: "success",
        });
        try {
          window.dispatchEvent(
            new CustomEvent("syncertica:stats-changed", {
              detail: { managerUUID: data.managerDeviceUUID || undefined },
            })
          );
        } catch (e) {
          console.debug("Could not dispatch stats-changed event:", e);
        }
      } else {
        const response = await fetch("/api/workers", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(workerData),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            showToast({
              message: "Your session has expired. Please log in again.",
              type: "error",
            });
            window.location.href = "/login";
            return;
          }
          let errorMsg = data.error || "Failed to create worker";
          if (data.details) {
            errorMsg = data.details
              .map((issue: { message: string }) => issue.message)
              .join("\n");
          }
          throw new Error(errorMsg);
        }

        setWorkers((prev) => [...prev, data]);
        showToast({
          message: "Worker created successfully",
          type: "success",
        });
        try {
          window.dispatchEvent(
            new CustomEvent("syncertica:stats-changed", {
              detail: { managerUUID: data.managerDeviceUUID || undefined },
            })
          );
        } catch (e) {
          console.debug("Could not dispatch stats-changed event:", e);
        }
      }

      setShowAddModal(false);
      setErrorMessage(null);
    } catch (error) {
      console.error("Error saving worker:", error);
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setErrorMessage(errorMsg);
      showToast({
        message: errorMsg,
        type: "error",
      });
    }
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setShowAddModal(true);
  };

  const handleRemoveWorker = async (workerId: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) {
      return;
    }

    try {
      setErrorMessage(null);

      const response = await fetch(`/api/workers?id=${workerId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          showToast({
            message: "Your session has expired. Please log in again.",
            type: "error",
          });
          window.location.href = "/login";
          return;
        }
        throw new Error(data.error || "Failed to delete worker");
      }

      setWorkers((prev) => prev.filter((worker) => worker.id !== workerId));
      showToast({
        message: "Worker deleted successfully",
        type: "success",
      });
      try {
        window.dispatchEvent(
          new CustomEvent("syncertica:stats-changed", { detail: {} })
        );
      } catch (e) {
        console.debug("Could not dispatch stats-changed event:", e);
      }
    } catch (error) {
      console.error("Error deleting worker:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete worker. Please try again.";
      setErrorMessage(message);
      showToast({
        message,
        type: "error",
      });
    }
  };

  // Chat and Call are handled by opening the CallChatModal with the selected member.

  // Calculate statistics
  const totalWorkers = workers.length;
  const workersByRole = workers.reduce((acc, worker) => {
    acc[worker.jobRole] = (acc[worker.jobRole] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getJobRoleIcon = (role: Worker["jobRole"]) => {
    switch (role) {
      case "UI/UX Designer":
        return <Palette className="w-5 h-5" />;
      case "Developer":
        return <Code className="w-5 h-5" />;
      case "Manager":
        return <Settings className="w-5 h-5" />;
      case "QA":
        return <Shield className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getJobRoleColor = (role: Worker["jobRole"]) => {
    switch (role) {
      case "UI/UX Designer":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Developer":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Manager":
        return "bg-green-100 text-green-700 border-green-200";
      case "QA":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="whitespace-pre-line">{errorMessage}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workers</h2>
          <p className="text-gray-600">Manage your team members and roles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Worker
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Total Workers</h3>
              <p className="text-2xl font-bold text-blue-600">{totalWorkers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Designers</h3>
              <p className="text-2xl font-bold text-purple-600">
                {workersByRole["UI/UX Designer"] || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Developers</h3>
              <p className="text-2xl font-bold text-blue-600">
                {workersByRole["Developer"] || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Managers</h3>
              <p className="text-2xl font-bold text-green-600">
                {workersByRole["Manager"] || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">QA</h3>
              <p className="text-2xl font-bold text-orange-600">
                {workersByRole["QA"] || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {!loading && workers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>
                No workers found. Click the &quot;Add Worker&quot; button to add
                your first team member.
              </p>
            </div>
          )}

          {!loading &&
            workers.map((worker) => (
              <div
                key={worker.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {worker.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {worker.pronouns} • {worker.email}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getJobRoleColor(
                            worker.jobRole
                          )}`}
                        >
                          {getJobRoleIcon(worker.jobRole)}
                          {worker.jobRole}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setModalMemberId(worker.id);
                        setModalMode("chat");
                        setShowCallChat(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chat"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setModalMemberId(worker.id);
                        setModalMode("call");
                        setShowCallChat(true);
                      }}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Call"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditWorker(worker)}
                      className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveWorker(worker.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <AddWorkerModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingWorker(null);
        }}
        onAddWorker={handleAddWorker}
        editingWorker={editingWorker}
      />
      <CallChatModal
        isOpen={showCallChat}
        onClose={() => {
          setShowCallChat(false);
          setModalMemberId(undefined);
        }}
        currentUser={managerProfile}
        initialMemberId={modalMemberId}
        initialMode={modalMode}
      />
    </div>
  );
}
