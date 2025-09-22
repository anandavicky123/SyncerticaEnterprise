import { SidebarSection } from "../app/shared/types/dashboard";

export interface DatabaseStats {
  totalTasks: number;
  todoTasks: number;
  doingTasks: number;
  doneTasks: number;
  blockedTasks: number;
  totalWorkers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  workersByRole: {
    "UI/UX Designer": number;
    Developer: number;
    "IT Supports": number;
    QA: number;
    "Data Analyst": number;
  };
}

export async function getDatabaseStats(
  managerDeviceUUID?: string
): Promise<DatabaseStats> {
  // Server expects managerDeviceUUID; prefer callers to pass it.
  const url = managerDeviceUUID
    ? `/api/stats?managerDeviceUUID=${encodeURIComponent(managerDeviceUUID)}`
    : "/api/stats"; // fallback for backward compatibility

  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("getDatabaseStats - failed response:", response.status, body);
    throw new Error("Failed to fetch database statistics");
  }
  const json = await response.json();
  console.debug("getDatabaseStats - url:", url, "->", json);
  return json;
}

export function generateDynamicSidebarItems(
  stats: DatabaseStats
): SidebarSection[] {
  return [
    {
      title: "Task Overview",
      items: [
        { name: "Total Tasks", count: stats.totalTasks, icon: "📋" },
        { name: "Todo", count: stats.todoTasks, icon: "📝" },
        { name: "In Progress", count: stats.doingTasks, icon: "⚡" },
        { name: "Completed", count: stats.doneTasks, icon: "✅" },
        { name: "Blocked", count: stats.blockedTasks, icon: "🚫" },
      ],
    },
    {
      title: "Team",
      items: [
        { name: "Total Workers", count: stats.totalWorkers, icon: "👥" },
        {
          name: "UI/UX Designers",
          count: stats.workersByRole["UI/UX Designer"],
          icon: "🎨",
        },
        {
          name: "Developers",
          count: stats.workersByRole.Developer,
          icon: "💻",
        },
        {
          name: "IT Supports",
          count: stats.workersByRole["IT Supports"],
          icon: "👨🏻‍💻",
        },
        { name: "QA Engineers", count: stats.workersByRole.QA, icon: "🔍" },
        {
          name: "Data Analysts",
          count: stats.workersByRole["Data Analyst"],
          icon: "📊",
        },
      ],
    },
    {
      title: "Projects",
      items: [
        { name: "Total Projects", count: stats.totalProjects, icon: "📁" },
        { name: "Active", count: stats.activeProjects, icon: "🟢" },
        { name: "Completed", count: stats.completedProjects, icon: "🏁" },
      ],
    },
  ];
}
