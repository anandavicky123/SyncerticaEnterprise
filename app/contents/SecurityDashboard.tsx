"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Activity, Clock } from "lucide-react";
import {
  mockSecurityAlerts,
  mockSecurityMetrics,
  mockComplianceStatus,
  mockAuditLogs,
} from "../shared/constants/dashboardData";
import {
  SecurityAlert,
  SecurityMetric,
  ComplianceStatus,
  AuditLog,
} from "../shared/types/dashboard";

interface SecurityDashboardProps {
  className?: string;
}

const ReportsDashboard: React.FC<SecurityDashboardProps> = ({
  className = "",
}) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [compliance, setCompliance] = useState<ComplianceStatus[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load mock data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch summary counts from reports APIs
        try {
          const uaRes = await fetch("/api/reports/user-activity?userId=manager_1");
          const ua = uaRes.ok ? await uaRes.json() : [];
          setAlerts(ua.slice(0, 5));
        } catch (e) {
          console.error("Failed fetching user activity:", e);
        }

        try {
          const ptRes = await fetch("/api/reports/project-tasks?projectId=project_1");
          const pt = ptRes.ok ? await ptRes.json() : [];
          setMetrics(pt.slice(0, 5));
        } catch (e) {
          console.error("Failed fetching project tasks:", e);
        }

        try {
          const nRes = await fetch("/api/reports/notifications?userId=manager_1");
          const ns = nRes.ok ? await nRes.json() : [];
          setCompliance(ns.slice(0, 5));
        } catch (e) {
          console.error("Failed fetching notifications:", e);
        }

        try {
          const mRes = await fetch("/api/reports/metrics?id=system_2025-09-09");
          const ms = mRes.ok ? await mRes.json() : [];
          setAuditLogs(ms.slice(0, 5));
        } catch (e) {
          console.error("Failed fetching metrics:", e);
        }
      } catch (error) {
        console.error("Error loading reports data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={metric.id ?? `metric-${idx}`}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{metric.icon}</span>
                <h3 className="text-lg font-semibold">{metric.name}</h3>
              </div>
              <span
                className={`text-sm px-2 py-1 rounded ${
                  metric.status === "good"
                    ? "bg-green-100 text-green-800"
                    : metric.status === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {metric.value}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      {/* Security Alerts */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Security Alerts</h2>
        <div className="space-y-4">
          {alerts.map((alert, idx) => (
            <div
              key={alert.id ?? `alert-${idx}`}
              className={`p-4 rounded-lg ${
                alert.severity === "high"
                  ? "bg-red-50 dark:bg-red-900/20"
                  : alert.severity === "medium"
                  ? "bg-yellow-50 dark:bg-yellow-900/20"
                  : "bg-blue-50 dark:bg-blue-900/20"
              }`}
            >
              <div className="flex items-start">
                <div
                  className={`p-2 rounded-full ${
                    alert.severity === "high"
                      ? "bg-red-100 text-red-600"
                      : alert.severity === "medium"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">{alert.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {alert.description}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {alert.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Compliance Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {compliance.map((item, idx) => (
            <div
              key={item.id ?? `compliance-${idx}`}
              className="border dark:border-gray-700 p-4 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{item.name}</h3>
                <span
                  className={`px-2 py-1 text-sm rounded ${
                    item.status === "compliant"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
              <div className="mt-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      item.status === "compliant"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Audit Logs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4">Timestamp</th>
                <th className="text-left py-3 px-4">Action</th>
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Resource</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, idx) => (
                <tr
                  key={log.id ?? `audit-${idx}`}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
                >
                  <td className="py-3 px-4 text-sm">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">{log.user}</td>
                  <td className="py-3 px-4">{log.resource}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-sm rounded ${
                        log.status === "success"
                          ? "bg-green-100 text-green-800"
                          : log.status === "warning"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
