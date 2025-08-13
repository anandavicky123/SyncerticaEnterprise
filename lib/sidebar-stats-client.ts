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
    Manager: number;
    QA: number;
  };
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const response = await fetch("/api/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch database statistics");
  }
  return response.json();
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
        { name: "Managers", count: stats.workersByRole.Manager, icon: "👔" },
        { name: "QA Engineers", count: stats.workersByRole.QA, icon: "🔍" },
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
