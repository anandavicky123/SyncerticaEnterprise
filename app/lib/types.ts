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
