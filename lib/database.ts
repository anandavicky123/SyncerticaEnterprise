import { PrismaClient } from "@prisma/client";

// Initialize Prisma Client
const prismaClientSingleton = () => {
  return new PrismaClient();
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string;
  assignedBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  stepFunctionArn?: string;
}

export interface Worker {
  id: string;
  managerDeviceUUID: string;
  name: string;
  pronouns?: string;
  jobRole: "UI/UX Designer" | "Developer" | "Manager" | "QA";
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repository?: string;
  status: "active" | "on-hold" | "completed" | "archived";
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

    return workers.map((worker) => ({
      id: worker.id,
      name: worker.name,
      pronouns: worker.pronouns || "",
      jobRole: worker.jobRole as Worker["jobRole"],
      email: worker.email,
      managerDeviceUUID: worker.managerDeviceUUID,
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
    }));
  }

  async getWorkerById(id: string): Promise<Worker | null> {
    const worker = await prisma.worker.findUnique({
      where: { id },
    });

    if (!worker) return null;

    return {
      id: worker.id,
      name: worker.name,
      pronouns: worker.pronouns || "",
      jobRole: worker.jobRole as Worker["jobRole"],
      email: worker.email,
      managerDeviceUUID: worker.managerDeviceUUID,
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
    };
  }

  async createWorker(
    worker: Omit<Worker, "id" | "createdAt" | "updatedAt">
  ): Promise<Worker> {
    const created = await prisma.worker.create({
      data: {
        ...worker,
        id: crypto.randomUUID(),
        passwordHash: "temp-password-hash", // Should be properly hashed in production
      },
    });

    return {
      id: created.id,
      name: created.name,
      pronouns: created.pronouns || "",
      jobRole: created.jobRole as Worker["jobRole"],
      email: created.email,
      managerDeviceUUID: created.managerDeviceUUID,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateWorker(
    id: string,
    updates: Partial<Omit<Worker, "id" | "managerDeviceUUID">>
  ): Promise<boolean> {
    try {
      await prisma.worker.update({
        where: { id },
        data: updates,
      });
      return true;
    } catch (error) {
      console.error("Error updating worker:", error);
      return false;
    }
  }

  async deleteWorker(id: string): Promise<boolean> {
    try {
      await prisma.worker.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting worker:", error);
      return false;
    }
  }

  // Task methods
  async getAllTasks(managerDeviceUUID: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: { assignedBy: managerDeviceUUID },
      include: {
        status: true,
      },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status.name as Task["status"],
      priority: task.priority,
      assignedTo: task.assignedTo,
      assignedBy: task.assignedBy,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      dueDate: task.dueDate?.toISOString(),
      tags: task.tags,
      estimatedHours: task.estimatedHours || undefined,
      actualHours: task.actualHours || undefined,
      stepFunctionArn: task.stepFunctionArn || undefined,
    }));
  }

  async getTaskById(id: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        status: true,
      },
    });

    if (!task) return null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status.name as Task["status"],
      priority: task.priority,
      assignedTo: task.assignedTo,
      assignedBy: task.assignedBy,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      dueDate: task.dueDate?.toISOString(),
      tags: task.tags,
      estimatedHours: task.estimatedHours || undefined,
      actualHours: task.actualHours || undefined,
      stepFunctionArn: task.stepFunctionArn || undefined,
    };
  }

  async createTask(
    managerDeviceUUID: string,
    task: Omit<Task, "id" | "createdAt" | "updatedAt">
  ): Promise<Task> {
    // Get or create status
    let status = await prisma.status.findFirst({
      where: {
        name: task.status,
        managerDeviceUUID,
      },
    });

    if (!status) {
      status = await prisma.status.create({
        data: {
          name: task.status,
          managerDeviceUUID,
        },
      });
    }

    const created = await prisma.task.create({
      data: {
        id: crypto.randomUUID(),
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignedTo: task.assignedTo,
        assignedBy: managerDeviceUUID,
        statusId: status.id,
        tags: task.tags,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        stepFunctionArn: task.stepFunctionArn,
        projectId: task.projectId || "default", // Make sure to handle project ID
      },
      include: {
        status: true,
      },
    });

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      status: created.status.name as Task["status"],
      priority: created.priority,
      assignedTo: created.assignedTo,
      assignedBy: created.assignedBy,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      dueDate: created.dueDate?.toISOString(),
      tags: created.tags,
      estimatedHours: created.estimatedHours || undefined,
      actualHours: created.actualHours || undefined,
      stepFunctionArn: created.stepFunctionArn || undefined,
    };
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<Task, "id" | "createdAt">>
  ): Promise<boolean> {
    try {
      if (updates.status) {
        const task = await prisma.task.findUnique({
          where: { id },
          select: { assignedBy: true },
        });

        if (!task) return false;

        let status = await prisma.status.findFirst({
          where: {
            name: updates.status,
            managerDeviceUUID: task.assignedBy,
          },
        });

        if (!status) {
          status = await prisma.status.create({
            data: {
              name: updates.status,
              managerDeviceUUID: task.assignedBy,
            },
          });
        }

        const { status: _, ...restUpdates } = updates;
        await prisma.task.update({
          where: { id },
          data: {
            ...restUpdates,
            statusId: status.id,
            dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
          },
        });
      } else {
        await prisma.task.update({
          where: { id },
          data: {
            ...updates,
            dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
          },
        });
      }
      return true;
    } catch (error) {
      console.error("Error updating task:", error);
      return false;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      await prisma.task.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      return false;
    }
  }

  // Project methods
  async getAllProjects(managerDeviceUUID: string): Promise<Project[]> {
    const projects = await prisma.project.findMany({
      where: { managerDeviceUUID },
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      repository: project.repository || undefined,
      status: project.status as Project["status"],
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    }));
  }

  async createProject(
    project: Omit<Project, "id" | "createdAt" | "updatedAt">,
    managerDeviceUUID: string
  ): Promise<Project> {
    const created = await prisma.project.create({
      data: {
        ...project,
        id: crypto.randomUUID(),
        managerDeviceUUID,
      },
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description || undefined,
      repository: created.repository || undefined,
      status: created.status as Project["status"],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async close(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export the singleton instance getter
export const getDatabase = () => DatabaseManager.getInstance();

// Export the class for type usage
export type { DatabaseManager };
