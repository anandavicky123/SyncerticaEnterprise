"use client";

import React, { useState, useEffect } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Server,
  DollarSign,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { MetricCard } from "../shared/types/dashboard";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  overview: {
    totalWorkers: number;
    totalProjects: number;
    totalTasks: number;
    totalNotifications: number;
    completedTasks: number;
    activeProjects: number;
    pendingTasks: number;
    taskCompletionRate: number;
    recentChats: number;
    recentTasksCreated: number;
    recentTasksCompleted: number;
    taskCompletionChange: number;
  };
  trends: {
    taskCreation: Array<{ date: string; count: number }>;
    taskCompletion: Array<{ date: string; count: number }>;
  };
  workers: Array<{
    id: string;
    name: string;
    taskCount: number;
    jobRole: string;
  }>;
  projectStatuses: Array<{
    status: string;
    count: number;
  }>;
  taskPriorities: Array<{
    priority: string;
    count: number;
  }>;
}

interface DataVisualizationDashboardProps {
  className?: string;
}

const DataVisualizationDashboard: React.FC<DataVisualizationDashboardProps> = ({
  className = "",
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managerUUID, setManagerUUID] = useState<string>("");

  // Fetch manager UUID from session
  useEffect(() => {
    const fetchManagerUUID = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });
        if (response.ok) {
          const sessionData = await response.json();
          if (sessionData.success && sessionData.session?.actorId) {
            setManagerUUID(sessionData.session.actorId);
          }
        }
      } catch (error) {
        console.error("Error fetching manager UUID:", error);
      }
    };
    fetchManagerUUID();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!managerUUID) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/analytics/overview?managerUUID=${managerUUID}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load analytics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [managerUUID]);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span>Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Failed to load analytics data</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { overview, trends, workers, projectStatuses } = analyticsData;

  // Create metrics cards from real data
  const dashboardMetrics: MetricCard[] = [
    {
      id: "1",
      title: "Total Workers",
      value: overview.totalWorkers,
      change: 0, // Could calculate from historical data
      changeType: "increase",
      period: "All time",
      icon: "👥",
      color: "blue",
    },
    {
      id: "2",
      title: "Active Projects",
      value: overview.activeProjects,
      change: 0,
      changeType: "increase",
      period: "Currently active",
      icon: "📋",
      color: "green",
    },
    {
      id: "3",
      title: "Task Completion Rate",
      value: `${overview.taskCompletionRate}%`,
      change: overview.taskCompletionChange,
      changeType: overview.taskCompletionChange >= 0 ? "increase" : "decrease",
      period: "Last 30 days",
      icon: "⚡",
      color: "yellow",
    },
    {
      id: "4",
      title: "Total Tasks",
      value: overview.totalTasks,
      change: 0,
      changeType: "increase",
      period: "All time",
      icon: "💰",
      color: "purple",
    },
  ];
  const getIconComponent = (iconName?: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      "👥": <Users className="w-6 h-6" />,
      "📋": <Activity className="w-6 h-6" />,
      "⚡": <Server className="w-6 h-6" />,
      "💰": <DollarSign className="w-6 h-6" />,
    };
    return iconMap[iconName ?? ""] || <Activity className="w-6 h-6" />;
  };

  const getColorClasses = (color?: string) => {
    const colorMap: {
      [key: string]: { bg: string; text: string; icon: string };
    } = {
      blue: { bg: "bg-blue-50", text: "text-blue-900", icon: "text-blue-600" },
      green: {
        bg: "bg-green-50",
        text: "text-green-900",
        icon: "text-green-600",
      },
      yellow: {
        bg: "bg-yellow-50",
        text: "text-yellow-900",
        icon: "text-yellow-600",
      },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-900",
        icon: "text-purple-600",
      },
    };
    return colorMap[color ?? "blue"] || colorMap.blue;
  };

  // Performance metrics chart data - using real task trends
  const performanceData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Tasks Created",
        data: trends.taskCreation.slice(-6).map((t) => t.count),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "Tasks Completed",
        data: trends.taskCompletion.slice(-6).map((t) => t.count),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // Worker productivity chart
  const workerProductivityData = {
    labels: workers.slice(0, 6).map((w) => w.name),
    datasets: [
      {
        label: "Tasks Assigned",
        data: workers.slice(0, 6).map((w) => w.taskCount),
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 205, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 205, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Task completion trend data
  const taskCompletionTrendData = {
    labels: trends.taskCompletion
      .slice(-6)
      .map((t) =>
        new Date(t.date).toLocaleDateString("en-US", { month: "short" })
      ),
    datasets: [
      {
        label: "Completed Tasks",
        data: trends.taskCompletion.slice(-6).map((t) => t.count),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // Project status distribution
  const projectStatusData = {
    labels: projectStatuses.map((p) => p.status),
    datasets: [
      {
        data: projectStatuses.map((p) => p.count),
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444", "#6366F1"],
        borderColor: ["#059669", "#D97706", "#DC2626", "#4F46E5"],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h2>
          <p className="text-gray-600">
            Real-time insights and AWS usage metrics
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live Data
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardMetrics.map((metric: MetricCard) => {
          const colors = getColorClasses(metric.color);
          return (
            <div
              key={metric.id}
              className={`${colors.bg} rounded-lg p-6 border border-gray-200`}
            >
              <div className="flex items-center justify-between">
                <div className={colors.icon}>
                  {getIconComponent(metric.icon)}
                </div>
                <div className="flex items-center gap-1">
                  {metric.changeType === "increase" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      metric.changeType === "increase"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metric.changeType === "increase" ? "+" : ""}
                    {metric.change}%
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <h3 className={`text-2xl font-bold ${colors.text}`}>
                  {typeof metric.value === "number"
                    ? metric.value.toLocaleString()
                    : metric.value}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{metric.title}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.period}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Task Activity Trends
            </h3>
            <span className="text-sm text-gray-500">Last 6 months</span>
          </div>
          <div className="h-64">
            <Line data={performanceData} options={chartOptions} />
          </div>
        </div>

        {/* Worker Productivity */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Worker Productivity
            </h3>
            <span className="text-sm text-gray-500">Tasks assigned</span>
          </div>
          <div className="h-64">
            <Bar data={workerProductivityData} options={chartOptions} />
          </div>
        </div>

        {/* Task Completion Trend */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Task Completion Trend
            </h3>
            <span className="text-sm text-gray-500">Last 6 months</span>
          </div>
          <div className="h-64">
            <Line data={taskCompletionTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Project Status Distribution */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Project Status Distribution
            </h3>
            <span className="text-sm text-gray-500">Current status</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut data={projectStatusData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Team Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {overview.taskCompletionRate}%
            </div>
            <div className="text-sm text-gray-600">Task Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {overview.totalWorkers}
            </div>
            <div className="text-sm text-gray-600">Active Workers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {overview.activeProjects}
            </div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {overview.recentChats}
            </div>
            <div className="text-sm text-gray-600">Recent Messages</div>
          </div>
        </div>

        {/* Task Status */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <h4 className="font-medium text-gray-900 mb-3">
            Task Status Overview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">Completed Tasks</h5>
                  <p className="text-sm text-gray-600">
                    Total: {overview.completedTasks}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {overview.recentTasksCompleted} completed recently
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {overview.taskCompletionChange >= 0 ? "+" : ""}
                  {overview.taskCompletionChange}%
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">Pending Tasks</h5>
                  <p className="text-sm text-gray-600">
                    Total: {overview.pendingTasks}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {overview.recentTasksCreated} created recently
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Worker Productivity Insights */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Team Productivity Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900">Active Workers</h4>
            <p className="text-sm text-green-700 mt-2">
              {overview.totalWorkers} team members are actively working on{" "}
              {overview.totalTasks} tasks across {overview.totalProjects}{" "}
              projects.
            </p>
            <div className="mt-3">
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(overview.taskCompletionRate, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-green-600 mt-1">
                {overview.taskCompletionRate}% completion rate
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900">Project Distribution</h4>
            <p className="text-sm text-blue-700 mt-2">
              {overview.activeProjects} active projects with an average of{" "}
              {Math.round(
                overview.totalTasks / Math.max(overview.activeProjects, 1)
              )}{" "}
              tasks per project.
            </p>
            <div className="mt-3 flex items-center text-sm text-blue-600">
              <CheckSquare className="w-4 h-4 mr-1" />
              Project Efficiency:{" "}
              {overview.activeProjects > 0 ? "Good" : "No active projects"}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900">Team Communication</h4>
            <p className="text-sm text-purple-700 mt-2">
              {overview.recentChats} recent messages exchanged. Active
              communication helps maintain productivity.
            </p>
            <div className="mt-3 flex items-center text-sm text-purple-600">
              <MessageSquare className="w-4 h-4 mr-1" />
              Communication: {overview.recentChats > 10 ? "Active" : "Low"}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        {workers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Top Performers</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {workers.slice(0, 3).map((worker, index) => (
                <div key={worker.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {worker.name}
                      </h5>
                      <p className="text-sm text-gray-600">{worker.jobRole}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {worker.taskCount} tasks assigned
                      </p>
                    </div>
                    <div className="text-2xl">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualizationDashboard;
