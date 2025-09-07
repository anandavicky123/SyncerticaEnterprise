"use client";

import React, { useState } from "react";
import { X, User, Mail, Briefcase, Lock } from "lucide-react";

type JobRole = "UI/UX Designer" | "Developer" | "Manager" | "QA";

interface Worker {
  id: string;
  name: string;
  pronouns: string | null;
  jobRole: JobRole;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWorker: (workerData: {
    name: string;
    pronouns: string | null;
    jobRole: JobRole;
    email: string;
    password?: string;
  }) => void;
  editingWorker?: Worker | null;
}

const AddWorkerModal = ({
  isOpen,
  onClose,
  onAddWorker,
  editingWorker = null,
}: AddWorkerModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingWorker?.name || "",
    pronouns: editingWorker?.pronouns || "",
    jobRole: editingWorker?.jobRole || "Developer",
    email: editingWorker?.email || "",
    password: "",
  });

  React.useEffect(() => {
    if (editingWorker) {
      setFormData({
        name: editingWorker.name,
        pronouns: editingWorker.pronouns || "",
        jobRole: editingWorker.jobRole,
        email: editingWorker.email,
        password: "", // Can't edit password, will be handled separately
      });
    } else {
      setFormData({
        name: "",
        pronouns: "",
        jobRole: "Developer",
        email: "",
        password: "",
      });
    }
  }, [editingWorker, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.jobRole || !formData.email) {
      alert("Please fill in all required fields");
      return;
    }

    if (!editingWorker && !formData.password) {
      alert("Password is required for new workers");
      return;
    }

    setLoading(true);

    try {
      await onAddWorker({
        name: formData.name,
        pronouns: formData.pronouns || null,
        jobRole: formData.jobRole as JobRole,
        email: formData.email,
        password: formData.password,
      });

      // Reset form only if not editing
      if (!editingWorker) {
        setFormData({
          name: "",
          pronouns: "",
          jobRole: "Developer",
          email: "",
          password: "",
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving worker:", error);
      if (error instanceof Error && error.message === "WORKER_LIMIT_REACHED") {
        alert(
          "You have reached the limit of 5 workers. Please upgrade to Pro to add more workers, or delete existing workers first."
        );
      } else {
        alert("Failed to save worker. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="flex-none p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingWorker ? "Edit Worker" : "Add New Worker"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Worker Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Worker Pronouns */}
            <div className="space-y-2">
              <label
                htmlFor="pronouns"
                className="block text-sm font-medium text-gray-700"
              >
                Pronouns
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="pronouns"
                  name="pronouns"
                  value={formData.pronouns}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="they/them"
                />
              </div>
            </div>

            {/* Job Role */}
            <div className="space-y-2">
              <label
                htmlFor="jobRole"
                className="block text-sm font-medium text-gray-700"
              >
                Job Role
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="jobRole"
                  name="jobRole"
                  required
                  value={formData.jobRole}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Developer">Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Manager">Manager</option>
                  <option value="QA">QA</option>
                </select>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Password - Only show for new workers */}
            {!editingWorker && (
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required={!editingWorker}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="flex-none p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                }`}
              >
                {loading
                  ? "Saving..."
                  : editingWorker
                  ? "Update Worker"
                  : "Add Worker"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkerModal;
