"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  Clock,
  Flag,
  CheckCircle,
  Circle,
  Play,
  Square,
  AlertTriangle,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  Edit,
  Trash2,
} from "lucide-react";
import { Task, User as UserType } from "../shared/types/dashboard";
import CreateTaskModal from "../ui/CreateTaskModal";
import EditTaskModal from "../ui/EditTaskModal";

interface TaskManagerProps {
  className?: string;
  currentUser?: UserType;
}

const TaskManager: React.FC<TaskManagerProps> = ({ className = "" }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<
    "all" | "todo" | "doing" | "done" | "blocked"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch tasks from database
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const tasksData = await response.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: {
    title: string;
    description: string;
    assignedTo: string;
    assignedBy: string;
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
        setTasks((prev) => [newTask, ...prev]);
        console.log("✅ Task created successfully:", newTask);
      } else {
        throw new Error("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditTask(true);
  };

  const handleUpdateTask = async (taskData: {
    id: string;
    title: string;
    description: string;
    assignedTo: string;
    priority: string;
    status: string;
    dueDate?: string;
    estimatedHours?: number;
    tags: string[];
  }) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks((prev) =>
          prev.map((task) => (task.id === taskData.id ? updatedTask : task))
        );
        console.log("✅ Task updated successfully:", updatedTask);
      } else {
        throw new Error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
        console.log("✅ Task deleted successfully");
      } else {
        throw new Error("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const [workers, setWorkers] = useState<{
    [key: string]: { name: string; email?: string };
  }>({});

  // Fetch workers to display names
  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/workers");
      if (response.ok) {
        const workersData = await response.json();
        const workersMap = workersData.reduce((acc: any, worker: any) => {
          acc[worker.id] = { name: worker.name, email: worker.email };
          return acc;
        }, {});
        setWorkers(workersMap);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    }
  };

  // Fetch workers when component mounts
  useEffect(() => {
    fetchWorkers();
  }, []);

  // Convert workers to users format for backward compatibility
  const users: Record<string, UserType> = Object.keys(workers).reduce(
    (acc, workerId) => {
      const worker = workers[workerId];
      acc[workerId] = {
        id: workerId,
        name: worker.name,
        email: worker.email || `${workerId}@syncertica.com`,
        role: "employee", // Default role, can be enhanced later
        department: "Development", // Default department, can be enhanced later
        lastLogin: "",
        cognitoId: "",
        permissions: [],
      };
      return acc;
    },
    {} as Record<string, UserType>
  );

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === "all" || task.status === filter;
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return <Circle className="w-5 h-5 text-gray-400" />;
      case "doing":
        return <Play className="w-5 h-5 text-blue-500" />;
      case "done":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "blocked":
        return <Square className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "high":
        return <Flag className="w-4 h-4" />;
      case "medium":
        return <Flag className="w-4 h-4" />;
      case "low":
        return <Flag className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: Task["status"]
  ) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updatedTask : task))
        );

        // Simulate AWS Step Functions workflow
        console.log(
          `🔄 AWS Step Functions: Task ${taskId} status changed to ${newStatus}`
        );
        console.log(`📊 Triggering CloudWatch metrics update`);
        console.log(`📨 SNS notification sent to stakeholders`);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const doing = tasks.filter((t) => t.status === "doing").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;

    return { total, todo, doing, done, blocked };
  };

  const stats = getTaskStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="text-gray-600">
            Powered by AWS Step Functions & DynamoDB
          </p>
        </div>
        <button
          onClick={() => setShowCreateTask(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">To Do</p>
              <p className="text-2xl font-bold text-gray-500">{stats.todo}</p>
            </div>
            <Circle className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.doing}</p>
            </div>
            <Play className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.done}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blocked</p>
              <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
            </div>
            <Square className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(
                    e.target.value as
                      | "all"
                      | "todo"
                      | "doing"
                      | "done"
                      | "blocked"
                  )
                }
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="doing">In Progress</option>
                <option value="done">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => {
                    const statusOrder: Task["status"][] = [
                      "todo",
                      "doing",
                      "done",
                    ];
                    const currentIndex = statusOrder.indexOf(task.status);
                    const nextStatus =
                      statusOrder[(currentIndex + 1) % statusOrder.length];
                    updateTaskStatus(task.id, nextStatus);
                  }}
                  className="mt-1"
                >
                  {getStatusIcon(task.status)}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {task.title}
                    </h3>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      <div className="flex items-center gap-1">
                        {getPriorityIcon(task.priority)}
                        {task.priority}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{users[task.assignedTo]?.name || "Unknown"}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {task.actualHours || 0}h / {task.estimatedHours}h
                      </span>
                    </div>
                    {task.stepFunctionArn && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Step Functions</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditTask(task)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Edit task"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AWS Integration Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          AWS Integration Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-blue-700">DynamoDB: Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-blue-700">Step Functions: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-blue-700">SNS Notifications: Enabled</span>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onCreateTask={handleCreateTask}
        currentUserId="admin-1"
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={showEditTask}
        onClose={() => {
          setShowEditTask(false);
          setEditingTask(null);
        }}
        onUpdateTask={handleUpdateTask}
        task={editingTask}
      />
    </div>
  );
};

export default TaskManager;
