"use client";

import React, { useState } from "react";
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
  const [workers, setWorkers] = useState<Worker[]>([
    {
      id: "1",
      name: "Alice Johnson",
      pronouns: "she/her",
      jobRole: "UI/UX Designer",
      email: "alice.johnson@syncertica.com",
    },
    {
      id: "2",
      name: "Bob Smith",
      pronouns: "he/him",
      jobRole: "Developer",
      email: "bob.smith@syncertica.com",
    },
    {
      id: "3",
      name: "Charlie Davis",
      pronouns: "they/them",
      jobRole: "Manager",
      email: "charlie.davis@syncertica.com",
    },
    {
      id: "4",
      name: "Diana Lee",
      pronouns: "she/her",
      jobRole: "QA",
      email: "diana.lee@syncertica.com",
    },
    {
      id: "5",
      name: "Ethan Wilson",
      pronouns: "he/him",
      jobRole: "Developer",
      email: "ethan.wilson@syncertica.com",
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [newWorker, setNewWorker] = useState({
    name: "",
    pronouns: "",
    jobRole: "Developer" as Worker["jobRole"],
    email: "",
  });

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

  const handleAddWorker = () => {
    if (newWorker.name && newWorker.pronouns) {
      const worker: Worker = {
        id: Date.now().toString(),
        name: newWorker.name,
        pronouns: newWorker.pronouns,
        jobRole: newWorker.jobRole,
        email: newWorker.email || undefined,
      };
      setWorkers([...workers, worker]);
      setNewWorker({ name: "", pronouns: "", jobRole: "Developer", email: "" });
      setShowAddModal(false);
    }
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setNewWorker({
      name: worker.name,
      pronouns: worker.pronouns,
      jobRole: worker.jobRole,
      email: worker.email || "",
    });
    setShowAddModal(true);
  };

  const handleUpdateWorker = () => {
    if (editingWorker && newWorker.name && newWorker.pronouns) {
      setWorkers(
        workers.map((worker) =>
          worker.id === editingWorker.id
            ? {
                ...worker,
                name: newWorker.name,
                pronouns: newWorker.pronouns,
                jobRole: newWorker.jobRole,
                email: newWorker.email || undefined,
              }
            : worker
        )
      );
      setEditingWorker(null);
      setNewWorker({ name: "", pronouns: "", jobRole: "Developer", email: "" });
      setShowAddModal(false);
    }
  };

  const handleRemoveWorker = (workerId: string) => {
    setWorkers(workers.filter((worker) => worker.id !== workerId));
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
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingWorker ? "Edit Worker" : "Add New Worker"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={newWorker.name}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter worker name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pronouns *
                </label>
                <input
                  type="text"
                  value={newWorker.pronouns}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, pronouns: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., he/him, she/her, they/them"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Role *
                </label>
                <select
                  value={newWorker.jobRole}
                  onChange={(e) =>
                    setNewWorker({
                      ...newWorker,
                      jobRole: e.target.value as Worker["jobRole"],
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Developer">Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Manager">Manager</option>
                  <option value="QA">QA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newWorker.email}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, email: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingWorker(null);
                  setNewWorker({
                    name: "",
                    pronouns: "",
                    jobRole: "Developer",
                    email: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingWorker ? handleUpdateWorker : handleAddWorker}
                disabled={!newWorker.name || !newWorker.pronouns}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingWorker ? "Update" : "Add"} Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersManagement;
