export interface SidebarItem {
  name: string;
  count?: number;
  icon: string;
  expanded?: boolean;
  subitems?: Array<{
    name: string;
    icon: string;
    count?: number;
  }>;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export interface Section {
  id: string;
  name: string;
  icon: string;
}

export interface ToolbarItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  disabled?: boolean;
}

export interface StickyNote {
  id: number;
  content: string;
  type: "text" | "checklist";
  x: number;
  y: number;
  color: string;
  items: Array<{
    text: string;
    completed: boolean;
  }>;
}

export interface DashboardBlock {
  id: string;
  type: "metric" | "chart" | "pie" | "line" | "comparison";
  title: string;
  value?: string;
  change?: string;
  changeType?: "positive" | "negative";
  period?: string;
  chartType?: string;
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  forecast?: string;
}

export interface DashboardBlocks {
  [key: string]: DashboardBlock[];
}

// Real-time WebSocket Types
export interface WebSocketMessage {
  id: string;
  type: "notification" | "activity" | "alert" | "task_update";
  title: string;
  message: string;
  timestamp: string;
  userId?: string;
  severity?: "low" | "medium" | "high" | "critical";
  read: boolean;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
  type:
    | "login"
    | "task_created"
    | "task_completed"
    | "file_upload"
    | "user_joined";
}

export interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "busy";
  lastSeen: string;
}

// Data Visualization Types

// Security Dashboard Types
export interface SecurityMetric {
  id: string;
  name: string;
  value: string | number;
  status: "good" | "warning" | "critical";
  description: string;
  icon: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
}

export interface ComplianceStatus {
  id: string;
  name: string;
  status: "compliant" | "non-compliant";
  description: string;
  percentage: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  resource: string;
  status: "success" | "warning" | "error";
}
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }>;
}

export interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: "increase" | "decrease";
  period: string;
  icon: string;
  color: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeTasks: number;
  completedTasks: number;
  systemUptime: string;
  avgResponseTime: number;
  errorRate: number;
}

// Security Dashboard Types
export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  status: "active" | "investigating" | "resolved";
  category:
    | "authentication"
    | "authorization"
    | "data_breach"
    | "suspicious_activity"
    | "compliance";
  affectedUsers?: number;
  source: string;
}

export interface SecurityMetric {
  id: string;
  name: string;
  value: number;
  maxValue: number;
  unit: string;
  status: "good" | "warning" | "critical";
  description: string;
}

export interface ComplianceStatus {
  framework: string;
  percentage: number;
  status: "compliant" | "partial" | "non_compliant";
  lastAudit: string;
  nextAudit: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  result: "success" | "failure";
  details?: string;
}

// Authentication & Authorization Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "employee" | "manager" | "viewer";
  avatar?: string;
  department?: string;
  lastLogin: string;
  cognitoId?: string;
  permissions: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

// AI Assistant Types
export interface ChatMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    confidence?: number;
    source?: "aws_q" | "sagemaker" | "bedrock";
    functionCalls?: string[];
  };
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  status: "active" | "training" | "inactive";
  accuracy: number;
  lastTrained: string;
}

// Task Management Types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "doing" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string;
  assignedBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
  attachments?: string[];
  estimatedHours?: number;
  actualHours?: number;
  stepFunctionArn?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  type: "comment" | "status_change" | "assignment";
}

// DevOps & CI/CD Types
export interface Pipeline {
  id: string;
  name: string;
  status: "running" | "success" | "failed" | "pending";
  lastRun: string;
  duration: number;
  branch: string;
  commit: string;
  author: string;
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  name: string;
  status: "running" | "success" | "failed" | "pending" | "skipped";
  duration?: number;
  logs?: string[];
  artifacts?: string[];
}

export interface Repository {
  id: string;
  name: string;
  url?: string;
  lastCommit?: string;
  author?: string;
  branch: string;
  language?: string;
  size?: string;
  source: string;
  lastUpdated: string;
  status: string;
  detectedFiles: {
    dockerfile: boolean;
    workflow: boolean;
    terraform: boolean;
  };
  connectionType: string;
  description: string;
  infraStatus?: "deployed" | "deploying" | "failed" | "not-deployed";
  infraResources?: number;
  infraCost?: string;
}

// Infrastructure as Code Types
export interface CloudFormationStack {
  id: string;
  name: string;
  status:
    | "CREATE_COMPLETE"
    | "UPDATE_COMPLETE"
    | "CREATE_IN_PROGRESS"
    | "UPDATE_IN_PROGRESS"
    | "DELETE_COMPLETE"
    | "ROLLBACK_COMPLETE";
  region: string;
  resources: number;
  createdAt: string;
  updatedAt: string;
  template?: string;
  parameters: Record<string, string>;
}

export interface AWSResource {
  id: string;
  type: string;
  name: string;
  status: "active" | "stopped" | "pending" | "terminated";
  region: string;
  cost: number;
  tags: Record<string, string>;
}

// Monitoring & Observability Types
export interface CloudWatchMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  dimensions: Record<string, string>;
}

export interface XRayTrace {
  id: string;
  duration: number;
  responseTime: number;
  status: "success" | "error" | "throttled";
  services: string[];
  annotations: Record<string, string>;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  service: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

// GitHub Integration Types
export interface GitHubRepository {
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  topics: string[];
}

export interface AWSDeploymentStatus {
  ecr: {
    status: "available" | "building" | "unknown";
    lastUpdate: Date;
  };
  ecs: {
    status: "running" | "deploying" | "stopped" | "unknown";
    lastUpdate: Date;
  };
  terraform: {
    status: "applied" | "planning" | "unknown";
    lastUpdate: Date;
  };
}
