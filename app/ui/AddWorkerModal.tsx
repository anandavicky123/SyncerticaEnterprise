"use client";

import React, { useState } from "react";
import { X, User, Mail, Briefcase } from "lucide-react";

interface Worker {
  id: string;
  name: string;
  pronouns: string;
  jobRole: "UI/UX Designer" | "Developer" | "Manager" | "QA";
  email?: string;
  avatar?: string;
}

interface AddWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWorker: (workerData: {
    name: string;
    pronouns: string;
    jobRole: Worker["jobRole"];
    email: string;
  }) => void;
  editingWorker?: Worker | null;
}

const AddWorkerModal: React.FC<AddWorkerModalProps> = ({
  isOpen,
  onClose,
  onAddWorker,
  editingWorker = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingWorker?.name || "",
    pronouns: editingWorker?.pronouns || "",
    jobRole: editingWorker?.jobRole || ("Developer" as Worker["jobRole"]),
    email: editingWorker?.email || "",
  });

  React.useEffect(() => {
    if (editingWorker) {
      setFormData({
        name: editingWorker.name,
        pronouns: editingWorker.pronouns,
        jobRole: editingWorker.jobRole,
        email: editingWorker.email || "",
      });
    } else {
      setFormData({
        name: "",
        pronouns: "",
        jobRole: "Developer",
        email: "",
      });
    }
  }, [editingWorker, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.pronouns || !formData.jobRole) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      await onAddWorker({
        name: formData.name,
        pronouns: formData.pronouns,
        jobRole: formData.jobRole,
        email: formData.email,
      });

      // Reset form only if not editing
      if (!editingWorker) {
        setFormData({
          name: "",
          pronouns: "",
          jobRole: "Developer",
          email: "",
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving worker:", error);
      alert("Failed to save worker. Please try again.");
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

  const getJobRoleIcon = (role: Worker["jobRole"]) => {
    switch (role) {
      case "UI/UX Designer":
        return "🎨";
      case "Developer":
        return "💻";
      case "Manager":
        return "📊";
      case "QA":
        return "🔍";
      default:
        return "👤";
    }
  };

  const getJobRoleDescription = (role: Worker["jobRole"]) => {
    switch (role) {
      case "UI/UX Designer":
        return "Responsible for user interface and experience design";
      case "Developer":
        return "Responsible for coding and technical implementation";
      case "Manager":
        return "Responsible for team management and project oversight";
      case "QA":
        return "Responsible for quality assurance and testing";
      default:
        return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Worker Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter worker's full name"
            />
          </div>

          {/* Pronouns */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pronouns *
            </label>
            <input
              type="text"
              name="pronouns"
              value={formData.pronouns}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., he/him, she/her, they/them"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pronouns help create an inclusive workplace environment
            </p>
          </div>

          {/* Job Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Job Role *
            </label>
            <select
              name="jobRole"
              value={formData.jobRole}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Developer">💻 Developer</option>
              <option value="UI/UX Designer">🎨 UI/UX Designer</option>
              <option value="Manager">📊 Manager</option>
              <option value="QA">🔍 QA</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getJobRoleDescription(formData.jobRole)}
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="worker@syncertica.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email is optional but recommended for notifications
            </p>
          </div>

          {/* Preview */}
          {formData.name && (
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="font-medium text-gray-900 mb-2">Worker Preview</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                  {getJobRoleIcon(formData.jobRole)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{formData.name}</p>
                  <p className="text-sm text-gray-600">
                    {formData.pronouns} • {formData.jobRole}
                  </p>
                  {formData.email && (
                    <p className="text-sm text-gray-500">{formData.email}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !formData.name ||
                !formData.pronouns ||
                !formData.jobRole
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingWorker ? "Updating..." : "Adding..."}
                </>
              ) : editingWorker ? (
                "Update Worker"
              ) : (
                "Add Worker"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkerModal;
