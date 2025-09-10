"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  Container,
  Server,
  Loader2,
} from "lucide-react";

// Types based on your DynamoDB schema
interface UserActivityReport {
  userId: string;
  timestamp: number;
  userType: "Manager" | "Worker";
  action: string;
  projectId?: string;
}

interface ProjectTaskReport {
  projectId: string;
  taskId: string;
  assignedTo: string;
  status: "open" | "in_progress" | "completed";
  priority?: string;
  startDate: string;
  dueDate: string;
  completedAt?: number;
  updatedBy: string;
}

interface NotificationItem {
  userId: string;
  createdAt: number;
  type: "system" | "task" | "deadline";
  message: string;
  status: "unread" | "read";
  triggeredBy?: string;
}

interface PerformanceMetric {
  entityType: "user" | "project" | "system";
  entityId_period: string;
  metricType: string;
  metricValue: number;
  period: string;
  calculatedAt: number;
}

interface ReportSummary {
  totalUsers: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  systemUptime: string;
  successRate: number;
}

const Reports: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "performance" | "compliance"
  >("overview");
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "week"
  );

  // State for different report data
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(
    null
  );
  const [userActivities, setUserActivities] = useState<UserActivityReport[]>(
    []
  );
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all report data in parallel
      const [summaryRes, activityRes, metricsRes, notificationsRes] =
        await Promise.all([
          fetch(`/api/reports/summary?timeRange=${timeRange}`),
          fetch(`/api/reports/activity?timeRange=${timeRange}`),
          fetch(`/api/reports/performance?timeRange=${timeRange}`),
          fetch(`/api/reports/notifications?timeRange=${timeRange}`),
        ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setReportSummary(summaryData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setUserActivities(activityData);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setPerformanceMetrics(metricsData);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData);
      }
    } catch (err) {
      console.error("Failed to fetch report data", err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchReportData();
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTabClasses = (tab: string) => {
    return `py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
      activeTab === tab
        ? "bg-blue-600 text-white"
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
    }`;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mr-3" />
            <span className="text-gray-500">Loading DynamoDB Reports...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Reports & Analytics
              </h2>
              <p className="text-gray-600">
                System performance, user activity, and compliance reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) =>
                  setTimeRange(e.target.value as "today" | "week" | "month")
                }
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            {/* Export Button */}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={getTabClasses("overview")}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={getTabClasses("activity")}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            User Activity
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            className={getTabClasses("performance")}
          >
            <Server className="w-4 h-4 inline mr-2" />
            Performance
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={getTabClasses("compliance")}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Compliance
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Users</p>
                    <p className="text-2xl font-bold">
                      {reportSummary?.totalUsers || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Active Projects</p>
                    <p className="text-2xl font-bold">
                      {reportSummary?.activeProjects || 0}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Completed Tasks</p>
                    <p className="text-2xl font-bold">
                      {reportSummary?.completedTasks || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">System Uptime</p>
                    <p className="text-2xl font-bold">
                      {reportSummary?.systemUptime || "99.9%"}
                    </p>
                  </div>
                  <Server className="w-8 h-8 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {userActivities.slice(0, 5).map((activity, index) => (
                  <div
                    key={`${activity.userId}-${activity.timestamp}-${index}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {activity.userType}{" "}
                        <span className="font-medium">{activity.userId}</span>{" "}
                        {activity.action}
                        {activity.projectId && (
                          <span className="text-gray-500">
                            {" "}
                            in project {activity.projectId}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                {userActivities.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No recent activity
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              User Activity Reports
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userActivities.map((activity, index) => (
                    <tr
                      key={`${activity.userId}-${activity.timestamp}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {activity.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            activity.userType === "Manager"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {activity.userType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.projectId || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userActivities.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No user activity data available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Metrics
            </h3>

            {/* Performance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Task Performance */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h4 className="font-semibold text-gray-900">
                    Task Performance
                  </h4>
                </div>
                {performanceMetrics
                  .filter(
                    (m) =>
                      m.entityType === "user" && m.metricType.includes("task")
                  )
                  .slice(0, 3)
                  .map((metric, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {metric.metricType.replace("_", " ")}
                        </span>
                        <span className="font-medium">
                          {metric.metricValue}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* GitHub Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <GitBranch className="w-6 h-6 text-purple-500" />
                  <h4 className="font-semibold text-gray-900">
                    CI/CD Performance
                  </h4>
                </div>
                {performanceMetrics
                  .filter(
                    (m) =>
                      m.entityType === "system" &&
                      m.entityId_period.includes("github")
                  )
                  .slice(0, 3)
                  .map((metric, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {metric.metricType.replace("_", " ")}
                        </span>
                        <span className="font-medium">
                          {metric.metricValue}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Infrastructure */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="w-6 h-6 text-orange-500" />
                  <h4 className="font-semibold text-gray-900">
                    Infrastructure
                  </h4>
                </div>
                {performanceMetrics
                  .filter(
                    (m) =>
                      m.entityType === "system" &&
                      (m.entityId_period.includes("terraform") ||
                        m.entityId_period.includes("docker"))
                  )
                  .slice(0, 3)
                  .map((metric, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {metric.metricType.replace("_", " ")}
                        </span>
                        <span className="font-medium">
                          {metric.metricValue}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Full Performance Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {performanceMetrics.map((metric, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {metric.entityId_period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.metricType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.metricValue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metric.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(metric.calculatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {performanceMetrics.length === 0 && (
                <div className="text-center py-12">
                  <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No performance metrics available
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications & Alerts
            </h3>

            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div
                  key={`${notification.userId}-${notification.createdAt}-${index}`}
                  className={`p-4 rounded-lg border ${
                    notification.status === "unread"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {notification.type === "system" && (
                          <Server className="w-4 h-4 text-blue-500" />
                        )}
                        {notification.type === "task" && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {notification.type === "deadline" && (
                          <Clock className="w-4 h-4 text-orange-500" />
                        )}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            notification.type === "system"
                              ? "bg-blue-100 text-blue-800"
                              : notification.type === "task"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {notification.type}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            notification.status === "unread"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {notification.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>User: {notification.userId}</span>
                        {notification.triggeredBy && (
                          <span>Triggered by: {notification.triggeredBy}</span>
                        )}
                        <span>{formatTimestamp(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
