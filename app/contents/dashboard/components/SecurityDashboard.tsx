"use client";

import React, { useState } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Activity,
  Users,
  FileText,
  Clock,
  Globe,
  Server,
} from "lucide-react";
import {
  mockSecurityAlerts,
  mockSecurityMetrics,
  mockComplianceStatus,
  mockAuditLogs,
} from "../../../shared/constants/dashboardData";
import {
  SecurityAlert,
  SecurityMetric,
  ComplianceStatus,
  AuditLog,
} from "../../../shared/types/dashboard";

interface SecurityDashboardProps {
  className?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  className = "",
}) => {
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "alerts" | "compliance" | "audit"
  >("overview");
  const [alerts] = useState<SecurityAlert[]>(mockSecurityAlerts);
  const [metrics] = useState<SecurityMetric[]>(mockSecurityMetrics);
  const [compliance] = useState<ComplianceStatus[]>(mockComplianceStatus);
  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertTriangle className="w-4 h-4" />;
      case "investigating":
        return <Eye className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-500";
      case "partial":
        return "bg-yellow-500";
      case "non_compliant":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "authentication":
        return <Lock className="w-4 h-4" />;
      case "authorization":
        return <Shield className="w-4 h-4" />;
      case "data_breach":
        return <FileText className="w-4 h-4" />;
      case "suspicious_activity":
        return <Activity className="w-4 h-4" />;
      case "compliance":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const overallSecurityScore = Math.round(
    metrics.reduce(
      (acc, metric) => acc + (metric.value / metric.maxValue) * 100,
      0
    ) / metrics.length
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Security Dashboard
          </h2>
          <p className="text-gray-600">
            Monitor security posture and compliance status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                overallSecurityScore >= 80
                  ? "bg-green-500"
                  : overallSecurityScore >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-medium">
              Security Score: {overallSecurityScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-red-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {alerts.filter((a) => a.status === "active").length}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">
              Active Threats
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {alerts.filter((a) => a.severity === "critical").length} critical
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-blue-600">
              <Shield className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {compliance.filter((c) => c.status === "compliant").length}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">
              Compliant Frameworks
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Out of {compliance.length} total
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-green-600">
              <CheckCircle className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold text-gray-900">99.9%</span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">
              AWS Security Uptime
            </h3>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-purple-600">
              <Users className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold text-gray-900">5</span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">Active Users</h3>
            <p className="text-xs text-gray-500 mt-1">Authenticated sessions</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: Shield },
            { id: "alerts", label: "Security Alerts", icon: AlertTriangle },
            { id: "compliance", label: "Compliance", icon: CheckCircle },
            { id: "audit", label: "Audit Logs", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setSelectedTab(
                    tab.id as "overview" | "alerts" | "compliance" | "audit"
                  )
                }
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {selectedTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Metrics */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Security Metrics
              </h3>
              <div className="space-y-4">
                {metrics.map((metric: SecurityMetric) => (
                  <div
                    key={metric.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {metric.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {metric.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold ${getMetricStatusColor(
                          metric.status
                        )}`}
                      >
                        {metric.value}
                        {metric.unit}
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            metric.status === "good"
                              ? "bg-green-500"
                              : metric.status === "warning"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${(metric.value / metric.maxValue) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AWS Security Services */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AWS Security Services
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        AWS Cognito
                      </h4>
                      <p className="text-xs text-gray-500">
                        User authentication & authorization
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        AWS WAF
                      </h4>
                      <p className="text-xs text-gray-500">
                        Web application firewall
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        AWS CloudTrail
                      </h4>
                      <p className="text-xs text-gray-500">
                        API logging & monitoring
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        AWS Security Hub
                      </h4>
                      <p className="text-xs text-gray-500">
                        Security posture management
                      </p>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "alerts" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Security Alerts
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {alerts.map((alert: SecurityAlert) => (
                <div key={alert.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {getCategoryIcon(alert.category)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Source: {alert.source}</span>
                          <span>•</span>
                          <span>
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                          {alert.affectedUsers && (
                            <>
                              <span>•</span>
                              <span>{alert.affectedUsers} users affected</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {getStatusIcon(alert.status)}
                        {alert.status}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === "compliance" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Compliance Status
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {compliance.map((item: ComplianceStatus) => (
                  <div
                    key={item.framework}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {item.framework}
                      </h4>
                      <div
                        className={`w-3 h-3 rounded-full ${getComplianceColor(
                          item.status
                        )}`}
                      ></div>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Compliance</span>
                        <span className="font-medium">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${getComplianceColor(
                            item.status
                          )}`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last audit:{" "}
                        {new Date(item.lastAudit).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Next audit:{" "}
                        {new Date(item.nextAudit).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === "audit" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Audit Logs
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log: AuditLog) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.resource}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.result === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.result === "success" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {log.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;
