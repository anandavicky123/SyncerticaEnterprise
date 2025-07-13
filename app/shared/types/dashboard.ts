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
}

export interface StickyNote {
  id: number;
  content: string;
  type: 'text' | 'checklist';
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
  type: 'metric' | 'chart' | 'pie' | 'line' | 'comparison';
  title: string;
  value?: string;
  change?: string;
  changeType?: 'positive' | 'negative';
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
