import { getDatabase } from "./database";
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
    developers: number;
    designers: number;
    managers: number;
    qa: number;
  };
}

export async function getDatabaseStats(
  managerDeviceUUID: string
): Promise<DatabaseStats> {
  if (!managerDeviceUUID) throw new Error("managerDeviceUUID is required");
  const db = getDatabase();

  // Get task statistics (await promises when db methods are async)
  const tasks = await db.getAllTasks(managerDeviceUUID).catch(() => []);
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const doingTasks = tasks.filter((t) => t.status === "doing").length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;

  // Get worker statistics
  const workers = await db.getAllWorkers(managerDeviceUUID).catch(() => []);
  const totalWorkers = workers.length;
  const workersByRole = {
    developers: workers.filter((w) => w.jobRole === "Developer").length,
    designers: workers.filter((w) => w.jobRole === "UI/UX Designer").length,
    managers: workers.filter((w) => w.jobRole === "Manager").length,
    qa: workers.filter((w) => w.jobRole === "QA").length,
  };

  // Get project statistics
  const projects = await db.getAllProjects(managerDeviceUUID).catch(() => []);
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter(
    (p) => p.status === "completed"
  ).length;

  return {
    totalTasks,
    todoTasks,
    doingTasks,
    doneTasks,
    blockedTasks,
    totalWorkers,
    totalProjects,
    activeProjects,
    completedProjects,
    workersByRole,
  };
}

export function generateDynamicSidebarItems(
  stats: DatabaseStats
): SidebarSection[] {
  const todayTasksCount = 0; // Could be enhanced to filter tasks by due date

  return [
    {
      title: "Tasks Overview",
      items: [
        { name: "All Tasks", count: stats.totalTasks, icon: "📋" },
        { name: "To Do", count: stats.todoTasks, icon: "⏳" },
        { name: "In Progress", count: stats.doingTasks, icon: "🔄" },
        { name: "Completed", count: stats.doneTasks, icon: "✅" },
        { name: "Blocked", count: stats.blockedTasks, icon: "🚫" },
        { name: "Due Today", count: todayTasksCount, icon: "📅" },
      ],
    },
    {
      title: "Projects & Analytics",
      items: [
        { name: "Active Projects", icon: "🚀", count: stats.activeProjects },
        {
          name: "Completed Projects",
          icon: "🏆",
          count: stats.completedProjects,
        },
        { name: "Total Projects", icon: "📊", count: stats.totalProjects },
        { name: "Performance Metrics", icon: "⚡" },
      ],
    },
    {
      title: "Team Management",
      items: [
        {
          name: "All Workers",
          icon: "👥",
          count: stats.totalWorkers,
          expanded: true,
          subitems: [
            {
              name: "Developers",
              icon: "💻",
              count: stats.workersByRole.developers,
            },
            {
              name: "UI/UX Designers",
              icon: "🎨",
              count: stats.workersByRole.designers,
            },
            {
              name: "Managers",
              icon: "👔",
              count: stats.workersByRole.managers,
            },
            { name: "QA Engineers", icon: "🔍", count: stats.workersByRole.qa },
          ],
        },
      ],
    },
    {
      title: "System & Security",
      items: [
        { name: "Security Dashboard", icon: "🔒" },
        { name: "System Health", icon: "💚" },
        { name: "Database Status", icon: "🗄️" },
        { name: "Performance", icon: "📈" },
      ],
    },
  ];
}
