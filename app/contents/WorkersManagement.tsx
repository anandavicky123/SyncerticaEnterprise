"use client";

import React, { useState, useEffect } from "react";
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
import AddWorkerModal from "../ui/AddWorkerModal";

interface Worker {
  id: string;
  name: string;
  pronouns: string;
  jobRole: "UI/UX Designer" | "Developer" | "Manager" | "QA";
  email?: string;
  avatar?: string;
}

interface WorkersManagementProps {
  className?: string;
}

const WorkersManagement: React.FC<WorkersManagementProps> = ({
  className = "",
}) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // Fetch workers from database
  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workers");
      if (response.ok) {
        const workersData = await response.json();
        setWorkers(workersData);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (workerData: {
    name: string;
    pronouns: string;
    jobRole: Worker["jobRole"];
    email: string;
  }) => {
    try {
      if (editingWorker) {
        // Update existing worker
        const response = await fetch("/api/workers", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingWorker.id,
            ...workerData,
          }),
        });

        if (response.ok) {
          const updatedWorker = await response.json();
          setWorkers((prev) =>
            prev.map((worker) =>
              worker.id === editingWorker.id ? updatedWorker : worker
            )
          );
          setEditingWorker(null);
        }
      } else {
        // Create new worker
        const response = await fetch("/api/workers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workerData),
        });

        if (response.ok) {
          const newWorker = await response.json();
          setWorkers((prev) => [...prev, newWorker]);
        }
      }
    } catch (error) {
      console.error("Error saving worker:", error);
      throw error;
    }
  };

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

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setShowAddModal(true);
  };

  const handleRemoveWorker = async (workerId: string) => {
    if (!confirm("Are you sure you want to delete this worker?")) {
      return;
    }

    try {
      const response = await fetch(`/api/workers?id=${workerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWorkers((prev) => prev.filter((worker) => worker.id !== workerId));
        console.log("✅ Worker deleted successfully");
      } else {
        throw new Error("Failed to delete worker");
      }
    } catch (error) {
      console.error("Error deleting worker:", error);
      alert("Failed to delete worker. Please try again.");
    }
  };

  const handleChat = (worker: Worker) => {
    console.log("Starting chat with", worker.name);
    // Implement chat functionality
  };

  const handleCall = (worker: Worker) => {
    console.log("Calling", worker.name);
    // Implement call functionality
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
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

      {/* Statistics */}
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

      {/* Workers List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {workers.map((worker) => (
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
                    <h4 className="font-medium text-gray-900">{worker.name}</h4>
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
                    onClick={() => handleChat(worker)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chat"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCall(worker)}
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

      {/* Add/Edit Worker Modal */}
      <AddWorkerModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingWorker(null);
        }}
        onAddWorker={handleAddWorker}
        editingWorker={editingWorker}
      />
    </div>
  );
};

export default WorkersManagement;
