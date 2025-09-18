// Consolidated, minimal types used across dashboard and sidebar
export interface SidebarItem {
  name: string;
  count?: number;
  icon?: string;
  expanded?: boolean;
  subitems?: Array<{ name: string; icon?: string; count?: number }>;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export interface ToolbarItem {
  name: string;
  icon?: any;
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
  items: Array<{ text: string; completed: boolean }>;
}

export interface Section {
  id: string;
  name: string;
  icon?: string;
}

export interface WebSocketMessage {
  id: string;
  type: string;
  title?: string;
  message: string;
  timestamp: string;
  userId?: string;
  severity?: string;
  read?: boolean;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  target?: string;
  type?: string;
}

export interface DashboardBlock {
  id: string;
  type?: string;
  title?: string;
  value?: string | number;
  change?: string;
  changeType?: string;
  period?: string;
  icon?: string;
  chartType?: string;
  data?: Array<{ name: string; value: number; color?: string }>;
  forecast?: string | number;
}

export interface DashboardBlocks {
  [key: string]: DashboardBlock[];
}

export interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  lastSeen?: string;
}

export interface SecurityMetric {
  id: string;
  name: string;
  value: number | string;
  maxValue?: number;
  unit?: string;
  status?: string;
  description?: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description?: string;
  severity?: string;
  timestamp?: string;
  status?: string;
  category?: string;
  affectedUsers?: number;
  source?: string;
}

export interface ComplianceStatus {
  id?: string;
  name?: string;
  percentage?: number;
  status?: string;
  framework?: string;
  lastAudit?: string;
  nextAudit?: string;
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
  change?: number;
  changeType?: "increase" | "decrease";
  period?: string;
  icon?: string;
  color?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  assignedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  projectId?: string;
  projectName?: string;
  tags?: string[];
  attachments?: string[];
  estimatedHours?: number;
  actualHours?: number;
  stepFunctionArn?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar?: string;
  department?: string;
  lastLogin?: string;
  cognitoId?: string;
  permissions?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: User | null;
  token?: string | null;
  refreshToken?: string | null;
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
