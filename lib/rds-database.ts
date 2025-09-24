import { PrismaClient, Prisma } from "@prisma/client";

// Use a singleton Prisma client similar to lib/database.ts to avoid exhausting connections
const prismaClientSingleton = () => new PrismaClient();
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Types (lightweight mirrors of what's used by the app)
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string;
  managerDeviceUUID?: string;
  createdAt: string;
  dueDate?: string;
  tags: string[];
  projectId?: string;
  projectName?: string;
}

export interface Worker {
  id: string;
  managerDeviceUUID: string;
  name: string;
  pronouns?: string;
  jobRole: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repository?: string;
  statusId: number;
  statusName?: string;
  createdAt: string;
  updatedAt: string;
}

export class DatabaseManager {
  private static instance: DatabaseManager;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async getAllWorkers(managerDeviceUUID: string): Promise<Worker[]> {
    const workers = await prisma.worker.findMany({
      where: { managerDeviceUUID },
    });
    return workers.map((w) => ({
      id: w.id,
      name: w.name,
      pronouns: w.pronouns || "",
      jobRole: w.jobRole,
      email: w.email,
      managerDeviceUUID: w.managerDeviceUUID,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));
  }

  async getWorkerById(id: string): Promise<Worker | null> {
    const w = await prisma.worker.findUnique({ where: { id } });
    if (!w) return null;
    return {
      id: w.id,
      name: w.name,
      pronouns: w.pronouns || "",
      jobRole: w.jobRole,
      email: w.email,
      managerDeviceUUID: w.managerDeviceUUID,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    };
  }

  async createWorker(
    worker: Partial<Worker> & { managerDeviceUUID: string },
  ): Promise<Worker> {
    const created = await prisma.worker.create({
      data: {
        id: crypto.randomUUID(),
        name: worker.name!,
        pronouns: worker.pronouns || null,
        jobRole: worker.jobRole || "Developer",
        email: worker.email || "",
        managerDeviceUUID: worker.managerDeviceUUID,
        passwordHash: "temp-password-hash",
      },
    });
    return {
      id: created.id,
      name: created.name,
      pronouns: created.pronouns || "",
      jobRole: created.jobRole,
      email: created.email,
      managerDeviceUUID: created.managerDeviceUUID,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateWorker(
    id: string,
    updates: Partial<Omit<Worker, "id" | "managerDeviceUUID">>,
  ): Promise<boolean> {
    try {
      await prisma.worker.update({
        where: { id },
        data: updates as Prisma.WorkerUpdateInput,
      });
      return true;
    } catch (err) {
      console.error("Error updating worker:", err);
      return false;
    }
  }

  async deleteWorker(id: string): Promise<boolean> {
    try {
      await prisma.worker.delete({ where: { id } });
      return true;
    } catch (err) {
      console.error("Error deleting worker:", err);
      return false;
    }
  }

  async getAllTasks(managerDeviceUUID?: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: managerDeviceUUID
        ? { manager: { deviceUUID: managerDeviceUUID } }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { status: true, project: true },
    });
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status?.name || "",
      priority: t.priority as Task["priority"],
      assignedTo: t.assignedTo,
      managerDeviceUUID: t.assignedBy,
      createdAt: t.createdAt.toISOString(),
      dueDate: t.dueDate?.toISOString(),
      tags: t.tags,
      projectId: t.projectId || undefined,
      projectName: t.project?.name || undefined,
    }));
  }

  async getTaskById(id: string): Promise<Task | null> {
    const t = await prisma.task.findUnique({
      where: { id },
      include: { status: true, project: true },
    });
    if (!t) return null;
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status?.name || "",
      priority: t.priority as Task["priority"],
      assignedTo: t.assignedTo,
      managerDeviceUUID: t.assignedBy,
      createdAt: t.createdAt.toISOString(),
      dueDate: t.dueDate?.toISOString(),
      tags: t.tags,
      projectId: t.projectId || undefined,
      projectName: t.project?.name || undefined,
    };
  }

  async createTask(
    managerDeviceUUID: string,
    task: Partial<Task> & {
      status: string;
      assignedTo: string;
      title: string;
      description: string;
      tags: string[];
    },
    projectId?: string,
  ): Promise<Task> {
    // ensure manager exists
    let manager = await prisma.manager.findUnique({
      where: { deviceUUID: managerDeviceUUID },
    });
    if (!manager) {
      manager = await prisma.manager.create({
        data: {
          deviceUUID: managerDeviceUUID,
          name: "Default Manager",
          dateFormat: "YYYY-MM-DD",
          timeFormat: "24h",
        },
      });
    }

    // get or create status
    let status = await prisma.status.findFirst({
      where: { name: task.status },
    });
    if (!status) {
      // provide a default category to satisfy DB constraints
      status = await prisma.status.create({
        data: {
          name: task.status,
          category: "task_status",
        },
      });
    }

    // validate provided projectId belongs to manager
    if (!projectId) {
      throw new Error("projectId is required - no default project available");
    }
    const projectCheck = await prisma.project.findFirst({
      where: { id: projectId, managerDeviceUUID },
    });
    if (!projectCheck) {
      throw new Error("Project not found or not accessible");
    }

    const created = await prisma.task.create({
      data: {
        id: crypto.randomUUID(),
        title: task.title!,
        description: task.description || "",
        priority: (task.priority as Task["priority"]) || "medium",
        assignedTo: task.assignedTo!,
        assignedBy: managerDeviceUUID,
        statusId: status.id,
        tags: task.tags || [],
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        // estimatedHours/actualHours/stepFunctionArn removed
        projectId: projectCheck.id,
      },
      include: { status: true, project: true },
    });

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      status: (created as any).status?.name || "",
      priority: created.priority as Task["priority"],
      assignedTo: created.assignedTo,
      managerDeviceUUID: created.assignedBy,
      createdAt: created.createdAt.toISOString(),
      dueDate: created.dueDate?.toISOString(),
      tags: created.tags,
      projectId: created.projectId || undefined,
      projectName: (created as any).project?.name || undefined,
    };
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const existing = await prisma.task.findUnique({
        where: { id },
        include: { manager: true },
      });
      if (!existing) return false;
      const managerDeviceUUID = existing.manager.deviceUUID;

      // handle status updates
      if (updates.status) {
        let status = await prisma.status.findFirst({
          where: { name: updates.status },
        });
        if (!status) {
          status = await prisma.status.create({
            data: {
              name: updates.status,
              category: "task_status",
              manager: { connect: { deviceUUID: managerDeviceUUID } },
            } as any,
          });
        }
        // build update payload
        const data: Prisma.TaskUpdateInput = {
          ...(updates as unknown as Prisma.TaskUpdateInput),
          status: { connect: { id: status.id } },
          dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        };
        // Respect explicit updatedAt from caller: either a timestamp string/date or null
        if ((updates as any).updatedAt !== undefined) {
          const incoming = (updates as any).updatedAt;
          if (incoming === null) (data as any).updatedAt = null;
          else if (incoming) (data as any).updatedAt = new Date(incoming);
        } else {
          // If status category indicates completion, default to now
          try {
            if (
              status.category &&
              status.category.toLowerCase() === "completed"
            ) {
              (data as any).updatedAt = new Date();
            }
          } catch {}
        }
        await prisma.task.update({ where: { id }, data });
      } else {
        const data: Prisma.TaskUpdateInput = {
          ...(updates as unknown as Prisma.TaskUpdateInput),
          dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
        };

        // validate projectId if present
        if ((updates as any).projectId !== undefined) {
          const incoming = (updates as any).projectId;
          if (!incoming) {
            // Remove project assignment - this may not be allowed by DB constraints
            throw new Error("Cannot remove project assignment from task");
          } else {
            const projectCheck = await prisma.project.findFirst({
              where: { id: incoming, managerDeviceUUID },
            });
            if (projectCheck) (data as any).projectId = projectCheck.id;
            else {
              throw new Error("Project not found or not accessible");
            }
          }
        }

        await prisma.task.update({ where: { id }, data });
      }
      return true;
    } catch (err) {
      console.error("Error updating task:", err);
      return false;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      const result = await prisma.task.deleteMany({ where: { id } });
      return result.count > 0;
    } catch (err) {
      console.error("Error deleting task:", err);
      return false;
    }
  }

  async getAllProjects(managerDeviceUUID: string): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      where: { managerDeviceUUID },
    });
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      repository: p.repository || undefined,
      statusId: (p as unknown as { statusId: number }).statusId || 5,
      statusName: this.getStatusName(
        (p as unknown as { statusId: number }).statusId || 5,
      ),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  }

  private getStatusName(statusId: number): string {
    const statusMap: Record<number, string> = {
      5: "active",
      6: "on-hold",
      7: "completed",
      8: "archived",
    };
    return statusMap[statusId] || "active";
  }

  async getProjectById(
    id: string,
    managerDeviceUUID?: string,
  ): Promise<Project | null> {
    const p = await prisma.project.findUnique({ where: { id } });
    if (!p) return null;
    if (managerDeviceUUID && p.managerDeviceUUID !== managerDeviceUUID)
      return null;
    return {
      id: p.id,
      name: p.name,
      description: p.description || undefined,
      repository: p.repository || undefined,
      statusId: (p as unknown as { statusId: number }).statusId || 5,
      statusName: this.getStatusName(
        (p as unknown as { statusId: number }).statusId || 5,
      ),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  async createProject(
    project: Partial<Project> & { managerDeviceUUID: string },
  ): Promise<Project> {
    const created = await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        name: project.name!,
        description: project.description || null,
        repository: project.repository || null,
        statusId: project.statusId || 5, // Default to active
        managerDeviceUUID: project.managerDeviceUUID,
      } as any,
    });
    return {
      id: created.id,
      name: created.name,
      description: created.description || undefined,
      repository: created.repository || undefined,
      statusId: (created as unknown as { statusId: number }).statusId || 5,
      statusName: this.getStatusName(
        (created as unknown as { statusId: number }).statusId || 5,
      ),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async close(): Promise<void> {
    await prisma.$disconnect();
  }
}

export const getDatabase = () => DatabaseManager.getInstance();

export default DatabaseManager;
