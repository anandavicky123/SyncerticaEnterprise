import {
  Section,
  DashboardBlocks,
  WebSocketMessage,
  ActivityFeedItem,
  OnlineUser,
  SecurityAlert,
  SecurityMetric,
  ComplianceStatus,
  AuditLog,
  MetricCard,
  ChartData,
} from "../types/dashboard";

export const sections: Section[] = [
  { id: "overview", name: "Overview", icon: "📊" },
  { id: "tasks", name: "Task Manager", icon: "✅" },
  { id: "projects", name: "Projects", icon: "📋" },
  { id: "workers", name: "Workers", icon: "👥" },
  { id: "reports", name: "Reports", icon: "📈" },
];

// The `sidebarItems` constant was intentionally removed. The sidebar is populated
// dynamically from RDS via `/api/stats` and the client-side helper in
// `lib/sidebar-stats-client.ts`. Keeping a static/dummy list here caused brief
// stale UI and the numbers flashing to incorrect values. If a static fallback is
// needed, set it explicitly in the Dashboard component instead.

export const dashboardBlocks: DashboardBlocks = {
  overview: [
    {
      id: "net-sales",
      type: "metric",
      title: "Net Sales",
      value: "$887",
      change: "-71.54%",
      changeType: "negative",
      period: "vs previous month",
    },
    {
      id: "gross-margin",
      type: "chart",
      title: "Gross Margin",
      chartType: "bar",
    },
    {
      id: "expenses",
      type: "pie",
      title: "Expenses",
      data: [
        { name: "Cost of Goods Sold", value: 60.6, color: "#22d3ee" },
        { name: "Finance Expense", value: 29.8, color: "#fbbf24" },
        { name: "Total Operating Costs", value: 9.6, color: "#34d399" },
      ],
    },
    {
      id: "net-profit",
      type: "line",
      title: "Net Profit",
      forecast: "$100.24",
    },
    {
      id: "expenses-income",
      type: "comparison",
      title: "Expenses vs Income",
    },
  ],
  analytics: [
    {
      id: "aws-performance",
      type: "chart",
      title: "AWS Services Performance",
      chartType: "line",
    },
    {
      id: "task-completion",
      type: "chart",
      title: "Task Completion Trends",
      chartType: "area",
    },
    {
      id: "user-activity",
      type: "chart",
      title: "User Activity Heatmap",
      chartType: "bar",
    },
    {
      id: "cost-optimization",
      type: "metric",
      title: "AWS Cost Savings",
      value: "$0.00",
      change: "100%",
      changeType: "positive",
      period: "Always Free Tier",
    },
  ],
  reports: [
    {
      id: "security-score",
      type: "metric",
      title: "Report Score",
      value: "87%",
      change: "+5%",
      changeType: "positive",
      period: "this month",
    },
    {
      id: "active-threats",
      type: "metric",
      title: "Active Threats",
      value: "3",
      change: "-2",
      changeType: "positive",
      period: "from yesterday",
    },
    {
      id: "compliance-status",
      type: "chart",
      title: "Compliance Status",
      chartType: "doughnut",
    },
    {
      id: "security-events",
      type: "chart",
      title: "Security Events Timeline",
      chartType: "line",
    },
  ],
  cloud: [
    {
      id: "aws-usage",
      type: "metric",
      title: "AWS Free Tier Usage",
      value: "45%",
      change: "+12%",
      changeType: "positive",
      period: "this month",
    },
    {
      id: "lambda-invocations",
      type: "chart",
      title: "Lambda Invocations",
      chartType: "bar",
    },
    {
      id: "dynamodb-operations",
      type: "chart",
      title: "DynamoDB Operations",
      chartType: "line",
    },
    {
      id: "s3-storage",
      type: "metric",
      title: "S3 Storage Used",
      value: "1.2GB",
      change: "+0.3GB",
      changeType: "positive",
      period: "this week",
    },
  ],
  sales: [
    {
      id: "total-revenue",
      type: "metric",
      title: "Total Revenue",
      value: "$45,239",
      change: "+8.2%",
      changeType: "positive",
    },
    {
      id: "sales-pipeline",
      type: "chart",
      title: "Sales Pipeline",
      chartType: "funnel",
    },
  ],
  workers: [
    {
      id: "active-users",
      type: "metric",
      title: "Active Users",
      value: "1,234",
      change: "+5.7%",
      changeType: "positive",
    },
    {
      id: "team-performance",
      type: "chart",
      title: "Team Performance",
      chartType: "radar",
    },
  ],
};

// Real-time WebSocket Mock Data
export const mockNotifications: WebSocketMessage[] = [
  {
    id: "1",
    type: "notification",
    title: "New Task Assigned",
    message: "You have been assigned to 'AWS Lambda Optimization' task",
    timestamp: new Date().toISOString(),
    userId: "user-1",
    severity: "medium",
    read: false,
  },
  {
    id: "2",
    type: "alert",
    title: "High CPU Usage",
    message: "AWS EC2 instance usage exceeded 85%",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    severity: "high",
    read: false,
  },
  {
    id: "3",
    type: "activity",
    title: "Deployment Completed",
    message: "Production deployment v2.1.4 completed successfully",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    severity: "low",
    read: true,
  },
];

export const mockActivityFeed: ActivityFeedItem[] = [
  {
    id: "1",
    userId: "user-1",
    userName: "John Doe",
    action: "completed task",
    target: "AWS DynamoDB Setup",
    timestamp: new Date().toISOString(),
    type: "task_completed",
  },
  {
    id: "2",
    userId: "user-2",
    userName: "Jane Smith",
    action: "uploaded file",
    target: "architecture-diagram.pdf",
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    type: "file_upload",
  },
  {
    id: "3",
    userId: "user-3",
    userName: "Mike Johnson",
    action: "joined workspace",
    target: "DevOps Team",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    type: "user_joined",
  },
];

export const mockOnlineUsers: OnlineUser[] = [
  {
    id: "user-1",
    name: "John Doe",
    status: "online",
    lastSeen: new Date().toISOString(),
  },
  {
    id: "user-2",
    name: "Jane Smith",
    status: "away",
    lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "user-3",
    name: "Mike Johnson",
    status: "busy",
    lastSeen: new Date().toISOString(),
  },
];

// Data Visualization Mock Data
export const dashboardMetrics: MetricCard[] = [
  {
    id: "total-users",
    title: "Total Users",
    value: 2847,
    change: 12.5,
    changeType: "increase",
    period: "vs last month",
    icon: "👥",
    color: "blue",
  },
  {
    id: "active-tasks",
    title: "Active Tasks",
    value: 156,
    change: -3.2,
    changeType: "decrease",
    period: "vs last week",
    icon: "📋",
    color: "green",
  },
  {
    id: "system-uptime",
    title: "System Uptime",
    value: "99.9%",
    change: 0.1,
    changeType: "increase",
    period: "this month",
    icon: "⚡",
    color: "yellow",
  },
  {
    id: "aws-costs",
    title: "AWS Costs",
    value: "$0.00",
    change: 0,
    changeType: "increase",
    period: "Always Free Tier",
    icon: "💰",
    color: "purple",
  },
];

export const chartData: ChartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Task Completion",
      data: [65, 59, 80, 81, 56, 55],
      backgroundColor: "rgba(59, 130, 246, 0.5)",
      borderColor: "rgba(59, 130, 246, 1)",
      borderWidth: 2,
      fill: true,
    },
    {
      label: "User Activity",
      data: [28, 48, 40, 19, 86, 27],
      backgroundColor: "rgba(16, 185, 129, 0.5)",
      borderColor: "rgba(16, 185, 129, 1)",
      borderWidth: 2,
      fill: true,
    },
  ],
};

// Security Dashboard Mock Data
export const mockSecurityAlerts: SecurityAlert[] = [
  {
    id: "sec-1",
    title: "Unusual Login Activity",
    description:
      "Multiple failed login attempts detected from IP 192.168.1.100",
    severity: "high",
    timestamp: new Date().toISOString(),
    status: "active",
    category: "authentication",
    affectedUsers: 1,
    source: "AWS Cognito",
  },
  {
    id: "sec-2",
    title: "Privilege Escalation Attempt",
    description:
      "User attempted to access admin resources without proper permissions",
    severity: "critical",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: "investigating",
    category: "authorization",
    affectedUsers: 1,
    source: "AWS IAM",
  },
  {
    id: "sec-3",
    title: "SSL Certificate Expiring",
    description: "SSL certificate for api.syncertica.com expires in 7 days",
    severity: "medium",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: "active",
    category: "compliance",
    source: "AWS Certificate Manager",
  },
];

export const mockSecurityMetrics: SecurityMetric[] = [
  {
    id: "threat-level",
    name: "Current Threat Level",
    value: 2,
    maxValue: 5,
    unit: "level",
    status: "good",
    description: "Overall security threat assessment",
  },
  {
    id: "failed-logins",
    name: "Failed Login Attempts",
    value: 12,
    maxValue: 50,
    unit: "attempts",
    status: "good",
    description: "Failed authentication attempts in last 24h",
  },
  {
    id: "vulnerability-score",
    name: "Vulnerability Score",
    value: 85,
    maxValue: 100,
    unit: "score",
    status: "warning",
    description: "System vulnerability assessment score",
  },
];

export const mockComplianceStatus: ComplianceStatus[] = [
  {
    framework: "SOC 2 Type II",
    percentage: 95,
    status: "compliant",
    lastAudit: "2024-01-15",
    nextAudit: "2024-07-15",
  },
  {
    framework: "ISO 27001",
    percentage: 88,
    status: "partial",
    lastAudit: "2024-02-20",
    nextAudit: "2024-08-20",
  },
  {
    framework: "GDPR",
    percentage: 98,
    status: "compliant",
    lastAudit: "2024-03-10",
    nextAudit: "2024-09-10",
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: "audit-1",
    timestamp: new Date().toISOString(),
    userId: "user-1",
    userName: "John Doe",
    action: "LOGIN",
    resource: "/dashboard",
    ipAddress: "192.168.1.50",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    result: "success",
  },
  {
    id: "audit-2",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    userId: "user-2",
    userName: "Jane Smith",
    action: "FILE_UPLOAD",
    resource: "/api/files/upload",
    ipAddress: "192.168.1.75",
    userAgent: "Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7)",
    result: "success",
    details: "Uploaded architecture-diagram.pdf (2.5MB)",
  },
  {
    id: "audit-3",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    userId: "unknown",
    userName: "Unknown User",
    action: "LOGIN_FAILED",
    resource: "/auth/login",
    ipAddress: "192.168.1.100",
    userAgent: "curl/7.68.0",
    result: "failure",
    details: "Invalid credentials provided",
  },
];
