"use client";

import React from "react";
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
} from "lucide-react";
import { dashboardMetrics, chartData } from "../shared/constants/dashboardData";
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

interface DataVisualizationDashboardProps {
  className?: string;
}

const DataVisualizationDashboard: React.FC<DataVisualizationDashboardProps> = ({
  className = "",
}) => {
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      "👥": <Users className="w-6 h-6" />,
      "📋": <Activity className="w-6 h-6" />,
      "⚡": <Server className="w-6 h-6" />,
      "💰": <DollarSign className="w-6 h-6" />,
    };
    return iconMap[iconName] || <Activity className="w-6 h-6" />;
  };

  const getColorClasses = (color: string) => {
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
    return colorMap[color] || colorMap.blue;
  };

  // Performance metrics chart data
  const performanceData = {
    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
    datasets: [
      {
        label: "AWS Lambda Invocations",
        data: [45, 52, 68, 84, 76, 59],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "DynamoDB Operations",
        data: [38, 45, 55, 70, 65, 48],
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // AWS Services usage chart
  const awsServicesData = {
    labels: [
      "Lambda",
      "DynamoDB",
      "S3",
      "CloudWatch",
      "Cognito",
      "API Gateway",
    ],
    datasets: [
      {
        label: "Usage (Free Tier %)",
        data: [23, 45, 12, 67, 34, 28],
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

  // System health doughnut chart
  const systemHealthData = {
    labels: ["Healthy", "Warning", "Critical"],
    datasets: [
      {
        data: [85, 12, 3],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        borderColor: ["#059669", "#D97706", "#DC2626"],
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
              AWS Services Performance
            </h3>
            <span className="text-sm text-gray-500">Last 24 hours</span>
          </div>
          <div className="h-64">
            <Line data={performanceData} options={chartOptions} />
          </div>
        </div>

        {/* AWS Services Usage */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              AWS Free Tier Usage
            </h3>
            <span className="text-sm text-gray-500">Current month</span>
          </div>
          <div className="h-64">
            <Bar data={awsServicesData} options={chartOptions} />
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
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              System Health
            </h3>
            <span className="text-sm text-gray-500">Real-time</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut data={systemHealthData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Project Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">94%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">4m 32s</div>
            <div className="text-sm text-gray-600">Avg Build Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">3</div>
            <div className="text-sm text-gray-600">Active Stacks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">$262.01</div>
            <div className="text-sm text-gray-600">Monthly Cost</div>
          </div>
        </div>

        {/* Deployment Status */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          <h4 className="font-medium text-gray-900 mb-3">
            AWS Deployment Status
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900 capitalize">
                    Production
                  </h5>
                  <p className="text-sm text-gray-600">Version: v2.1.4</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Deployed 2 hours ago
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  deployed
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900 capitalize">
                    Staging
                  </h5>
                  <p className="text-sm text-gray-600">Version: v2.2.0-beta</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Deployed 30 minutes ago
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  deploying
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AWS Cost Optimization Insights */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          AWS Cost Optimization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900">Free Tier Status</h4>
            <p className="text-sm text-green-700 mt-2">
              All services are within AWS Always Free limits. No charges
              incurred this month.
            </p>
            <div className="mt-3">
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "45%" }}
                ></div>
              </div>
              <p className="text-xs text-green-600 mt-1">
                45% of free tier used
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900">Lambda Efficiency</h4>
            <p className="text-sm text-blue-700 mt-2">
              Average execution time: 245ms. Memory optimization can reduce
              costs by 15%.
            </p>
            <div className="mt-3 flex items-center text-sm text-blue-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Efficiency Score: 87%
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900">
              Storage Optimization
            </h4>
            <p className="text-sm text-purple-700 mt-2">
              S3 storage: 1.2GB used. Consider lifecycle policies for long-term
              savings.
            </p>
            <div className="mt-3 flex items-center text-sm text-purple-600">
              <Server className="w-4 h-4 mr-1" />
              Potential Savings: $0.00 (Free Tier)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualizationDashboard;
