"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Flag, User, Tag } from "lucide-react";

interface Worker {
  id: string;
  name: string;
  pronouns: string;
  jobRole: "UI/UX Designer" | "Developer" | "Manager" | "QA";
  email?: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: {
    title: string;
    description: string;
    assignedTo: string;
    managerdeviceuuid: string;
    priority: string;
    dueDate?: string;
    estimatedHours?: number;
    projectId?: string;
    tags: string[];
  }) => void;
  currentUserId?: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  currentUserId = "11111111-1111-1111-1111-111111111111",
}) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    projectId: "",
    dueDate: "",
    estimatedHours: "",
    tags: "",
  });

  // Fetch workers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWorkers();
      fetchProjects();
    }
  }, [isOpen]);

  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/workers");
      if (response.ok) {
        const workersData = await response.json();
        setWorkers(workersData);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.assignedTo) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        managerdeviceuuid: currentUserId,
        priority: formData.priority,
        projectId: formData.projectId || undefined,
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours
          ? parseInt(formData.estimatedHours)
          : undefined,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      };

      await onCreateTask(taskData);

      // Reset form
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        projectId: "",
        dueDate: "",
        estimatedHours: "",
        tags: "",
      });

      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Task
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
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter task title..."
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the task in detail..."
            />
          </div>

          {/* Assign To and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assign To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Assign To *
              </label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a worker...</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} ({worker.pronouns}) - {worker.jobRole}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="w-4 h-4 inline mr-1" />
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>
          </div>

          {/* Project (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (optional)
            </label>
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- No project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Selecting a project is optional. Leave empty to create a
              standalone task.
            </p>
          </div>

          {/* Due Date and Estimated Hours Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date
              </label>
              <input
                type="datetime-local"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Estimated Hours
              </label>
              <input
                type="number"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleInputChange}
                min="1"
                max="200"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 8"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter tags separated by commas (e.g., frontend, react, urgent)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate tags with commas. These help categorize and filter tasks.
            </p>
          </div>

          {/* Preview Section */}
          {formData.title && (
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="font-medium text-gray-900 mb-2">Task Preview</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Title:</strong> {formData.title}
                </p>
                <p>
                  <strong>Assigned To:</strong>{" "}
                  {formData.assignedTo
                    ? workers.find((w) => w.id === formData.assignedTo)?.name ||
                      "Unknown"
                    : "Not assigned"}
                </p>
                {formData.projectId && (
                  <p>
                    <strong>Project:</strong>{" "}
                    {projects.find((p) => p.id === formData.projectId)?.name ||
                      "Unknown"}
                  </p>
                )}
                <p>
                  <strong>Priority:</strong>
                  <span
                    className={`ml-1 ${getPriorityColor(formData.priority)}`}
                  >
                    {formData.priority.charAt(0).toUpperCase() +
                      formData.priority.slice(1)}
                  </span>
                </p>
                {formData.dueDate && (
                  <p>
                    <strong>Due:</strong>{" "}
                    {new Date(formData.dueDate).toLocaleDateString()}
                  </p>
                )}
                {formData.estimatedHours && (
                  <p>
                    <strong>Estimated:</strong> {formData.estimatedHours} hours
                  </p>
                )}
                {formData.tags && (
                  <p>
                    <strong>Tags:</strong> {formData.tags}
                  </p>
                )}
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
                !formData.title ||
                !formData.description ||
                !formData.assignedTo
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
