"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
const WorkerChatModal = dynamic(() => import("../ui/WorkerChatModal"), {
  ssr: false,
});

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  project: {
    name: string;
    description?: string;
  };
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [worker, setWorker] = useState<{ name: string; email: string } | null>(
    null
  );
  const [filter, setFilter] = useState("all");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    fetchTasks();
    // also fetch unread chat count for badge
    (async () => {
      try {
        // Query DynamoDB-backed unread notifications for current actor
        const res = await fetch("/api/notifications/unread", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({ unread: 0 }));
          setChatUnread(typeof data.unread === "number" ? data.unread : 0);
        }
      } catch (err) {
        console.debug("Failed to fetch chat unread count", err);
      }
    })();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch worker info first
      const workerRes = await fetch("/api/workers/me", {
        credentials: "include",
      });
      if (!workerRes.ok) {
        throw new Error("Failed to get worker info");
      }
      const workerData = await workerRes.json();
      setWorker({ name: workerData.name, email: workerData.email });

      // Fetch tasks assigned to this worker
      const tasksRes = await fetch("/api/tasks/worker", {
        credentials: "include",
      });
      if (!tasksRes.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const tasksData: Task[] = await tasksRes.json();
      setTasks(tasksData);
    } catch (err) {
      console.error("Error fetching tasks or worker info:", err);
      setError((err as Error).message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      // Update local state immediately for better UX
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: newStatus,
              }
            : task
        )
      );

      // Persist the change to the server
      const response = await fetch("/api/tasks", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });

      if (!response.ok) {
        // Revert local change and surface error
        console.error("Failed to update task on server");
        await fetchTasks();
        setError("Failed to update task status. Changes were reverted.");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert the change if API call fails
      fetchTasks();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "doing":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "critical":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  Worker Dashboard
                </h1>
                {/* Chat button placed immediately to the right of the heading */}
                <button
                  onClick={async () => {
                    // Optimistically clear unread badge for immediate feedback
                    setIsChatOpen(true);
                    setChatUnread(0);

                    try {
                      await fetch("/api/notifications/mark-all-read", {
                        method: "POST",
                        credentials: "include",
                      });
                    } catch (err) {
                      console.debug("Failed to mark notifications read:", err);
                      // If server call fails, re-fetch authoritative unread count
                      try {
                        const r = await fetch("/api/notifications/unread", {
                          credentials: "include",
                        });
                        if (r.ok) {
                          const d = await r.json().catch(() => ({ unread: 0 }));
                          setChatUnread(
                            typeof d.unread === "number" ? d.unread : 0
                          );
                        }
                      } catch (e) {
                        console.debug(
                          "Failed to refresh unread after mark-fail",
                          e
                        );
                      }
                    }
                  }}
                  aria-label="Open chat"
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-6 h-6" />
                  {chatUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chatUnread > 9 ? "9+" : chatUnread}
                    </span>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700 mr-4">
                  {worker ? (
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {worker.name}
                      </div>
                      <div className="text-gray-500">{worker.email}</div>
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={async () => {
                    try {
                      // Call logout API to properly invalidate session
                      await fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include",
                      });
                    } catch (error) {
                      console.error("Logout API error:", error);
                    } finally {
                      // Clear cookie and redirect even if API fails
                      document.cookie =
                        "session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                      window.location.href = "/login";
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-900">
                Worker Dashboard
              </h1>
              {/* Chat button placed immediately to the right of the heading */}
              <button
                onClick={async () => {
                  setIsChatOpen(true);
                  setChatUnread(0);

                  try {
                    await fetch("/api/notifications/mark-all-read", {
                      method: "POST",
                      credentials: "include",
                    });
                  } catch (err) {
                    console.debug("Failed to mark notifications read:", err);
                    try {
                      const r = await fetch("/api/notifications/unread", {
                        credentials: "include",
                      });
                      if (r.ok) {
                        const d = await r.json().catch(() => ({ unread: 0 }));
                        setChatUnread(
                          typeof d.unread === "number" ? d.unread : 0
                        );
                      }
                    } catch (e) {
                      console.debug(
                        "Failed to refresh unread after mark-fail",
                        e
                      );
                    }
                  }
                }}
                aria-label="Open chat"
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
                {chatUnread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                )}
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700 mr-4">
                {worker ? (
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {worker.name}
                    </div>
                    <div className="text-gray-500">{worker.email}</div>
                  </div>
                ) : null}
              </div>
              <button
                onClick={async () => {
                  try {
                    // Call logout API to properly invalidate session
                    await fetch("/api/auth/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                  } catch (error) {
                    console.error("Logout API error:", error);
                  } finally {
                    // Clear cookie and redirect even if API fails
                    document.cookie =
                      "session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                    window.location.href = "/login";
                  }
                }}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
              <p className="mt-2 text-sm text-gray-700">
                View and manage your assigned tasks and project work.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: "all", label: "All Tasks", count: taskCounts.all },
                  { key: "todo", label: "To Do", count: taskCounts.todo },
                  {
                    key: "doing",
                    label: "In Progress",
                    count: taskCounts.doing,
                  },
                  { key: "done", label: "Completed", count: taskCounts.done },
                  {
                    key: "blocked",
                    label: "Blocked",
                    count: taskCounts.blocked,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      filter === tab.key
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                          filter === tab.key
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tasks List */}
          <div className="mt-6">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tasks found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === "all"
                    ? "You don't have any tasks assigned yet."
                    : `No tasks with status "${filter}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white shadow rounded-lg border border-gray-200"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {task.title}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg
                                className="mr-1.5 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                              </svg>
                              {task.project.name}
                            </span>

                            {task.dueDate && (
                              <span className="flex items-center">
                                <svg
                                  className="mr-1.5 h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Due{" "}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}

                            {/* estimated/actual hours removed */}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              updateTaskStatus(task.id, e.target.value)
                            }
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                              task.status
                            )}`}
                          >
                            <option value="todo">To Do</option>
                            <option value="doing">In Progress</option>
                            <option value="done">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Created{" "}
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          Updated{" "}
                         
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Summary */}
          {tasks.length > 0 && (
            <div className="mt-8 bg-white shadow rounded-lg">
              <div className="px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Task Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {taskCounts.todo}
                    </div>
                    <div className="text-sm text-gray-500">To Do</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {taskCounts.doing}
                    </div>
                    <div className="text-sm text-gray-500">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {taskCounts.done}
                    </div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {taskCounts.blocked}
                    </div>
                    <div className="text-sm text-gray-500">Blocked</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Button removed - chat button moved to top bar */}

      {/* Worker Chat Modal */}
      <WorkerChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
