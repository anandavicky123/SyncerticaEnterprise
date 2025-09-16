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
  managerdeviceuuid: string; // This matches the database column name
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

  async getAllTasks(managerDeviceUUID?: string): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: managerDeviceUUID ? { assignedBy: managerDeviceUUID } : undefined,
      include: {
        status: true,
      },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status.name as Task["status"],
      priority: task.priority as Task["priority"],
      assignedTo: task.assignedTo,
      managerdeviceuuid: task.assignedBy,
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
      priority: task.priority as Task["priority"],
      assignedTo: task.assignedTo,
      managerdeviceuuid: task.assignedBy,
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
    // Ensure the manager exists first
    let manager = await prisma.manager.findUnique({
      where: { deviceUUID: managerDeviceUUID },
    });

    if (!manager) {
      // Create the manager if it doesn't exist
      manager = await prisma.manager.create({
        data: {
          deviceUUID: managerDeviceUUID,
          name: "Default Manager",
          dateFormat: "YYYY-MM-DD",
          timeFormat: "24h",
        },
      });
    }

    // Helper: get allowed categories from DB check constraint (if present)
    const getAllowedStatusCategories = async (): Promise<string[]> => {
      try {
        const rows = await prisma.$queryRaw<Array<{ def: string }>>`
          SELECT pg_get_constraintdef(c.oid) AS def
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          WHERE t.relname = 'statuses' AND c.conname = 'statuses_category_check'
    `;
        if (rows && rows[0]?.def) {
          const def = rows[0].def as string; // e.g., CHECK ((category = ANY (ARRAY['workflow'::text,'task_status'::text])))
          const matches = [...def.matchAll(/'([^']+)'/g)].map((m) => m[1]);
          if (matches.length) return matches;
          const inList = def.match(/\(([^\)]+)\)/);
          if (inList && inList[1]) {
            return inList[1]
              .split(",")
              .map((s) => s.replace(/['":\s]/g, ""))
              .filter(Boolean);
          }
        }
      } catch {
        // ignore; will use fallback list
      }
      return ["workflow", "tasks", "task_status", "general", "status"];
    };

    // Ensure a default project exists for this manager
    let defaultProject = await prisma.project.findFirst({
      where: { managerDeviceUUID, name: "Default Project" },
    });
    if (!defaultProject) {
      defaultProject = await prisma.project.create({
        data: {
          id: crypto.randomUUID(),
          managerDeviceUUID,
          name: "Default Project",
          description: "Auto-created default project",
          status: "active",
        },
      });
    }

    // Get or create status
    let status = await prisma.status.findFirst({
      where: {
        name: task.status,
        managerDeviceUUID,
      },
    });

    if (!status) {
      const categoryCandidates = await getAllowedStatusCategories();
      let createdStatusLocal = null as Awaited<
        ReturnType<typeof prisma.status.create>
      > | null;
      for (const category of categoryCandidates) {
        try {
          createdStatusLocal = await prisma.status.create({
            data: {
              name: task.status,
              category,
              managerDeviceUUID,
            },
          });
          break;
        } catch {
          // try next category
        }
      }
      if (!createdStatusLocal) {
        throw new Error(
          "Failed to create status due to category check constraint. Please adjust allowed categories or seed statuses."
        );
      }
      status = createdStatusLocal;
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
        projectId: defaultProject.id,
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
      priority: created.priority as Task["priority"],
      assignedTo: created.assignedTo,
      managerdeviceuuid: created.assignedBy,
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
          const rows = await prisma.$queryRaw<Array<{ def: string }>>`
            SELECT pg_get_constraintdef(c.oid) AS def
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            WHERE t.relname = 'statuses' AND c.conname = 'statuses_category_check'
          `;
          const candidates = (() => {
            if (rows && rows[0]?.def) {
              const def = rows[0].def as string;
              const matches = [...def.matchAll(/'([^']+)'/g)].map((m) => m[1]);
              if (matches.length) return matches;
            }
            return ["workflow", "tasks", "task_status", "general", "status"];
          })();
          let newStatus: Awaited<
            ReturnType<typeof prisma.status.create>
          > | null = null;
          for (const category of candidates) {
            try {
              newStatus = await prisma.status.create({
                data: {
                  name: updates.status,
                  category,
                  managerDeviceUUID: task.assignedBy,
                },
              });
              break;
            } catch {
              // continue
            }
          }
          if (!newStatus) {
            throw new Error(
              "Failed to create status due to category check constraint. Please adjust allowed categories or seed statuses."
            );
          }
          status = newStatus;
        }

        // Build prisma update data without undefineds and excluding status
        const maybeUpdates = updates as Partial<Omit<Task, "id" | "createdAt">>;
        const data: Record<string, unknown> = {};
        if (maybeUpdates.title !== undefined) data.title = maybeUpdates.title;
        if (maybeUpdates.description !== undefined)
          data.description = maybeUpdates.description;
        if (maybeUpdates.priority !== undefined)
          data.priority = maybeUpdates.priority;
        if (maybeUpdates.assignedTo !== undefined)
          data.assignedTo = maybeUpdates.assignedTo;
        if (maybeUpdates.tags !== undefined) data.tags = maybeUpdates.tags;
        if (maybeUpdates.estimatedHours !== undefined)
          data.estimatedHours = maybeUpdates.estimatedHours;
        if (maybeUpdates.actualHours !== undefined)
          data.actualHours = maybeUpdates.actualHours;
        if (maybeUpdates.stepFunctionArn !== undefined)
          data.stepFunctionArn = maybeUpdates.stepFunctionArn;
        data.statusId = status.id;
        data.dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined;

        await prisma.task.update({
          where: { id },
          data,
        });
      } else {
        // Build prisma update data without undefineds
        const maybeUpdates2 = updates as Partial<
          Omit<Task, "id" | "createdAt">
        >;
        const data2: Record<string, unknown> = {};
        if (maybeUpdates2.title !== undefined)
          data2.title = maybeUpdates2.title;
        if (maybeUpdates2.description !== undefined)
          data2.description = maybeUpdates2.description;
        if (maybeUpdates2.priority !== undefined)
          data2.priority = maybeUpdates2.priority;
        if (maybeUpdates2.assignedTo !== undefined)
          data2.assignedTo = maybeUpdates2.assignedTo;
        if (maybeUpdates2.tags !== undefined) data2.tags = maybeUpdates2.tags;
        if (maybeUpdates2.estimatedHours !== undefined)
          data2.estimatedHours = maybeUpdates2.estimatedHours;
        if (maybeUpdates2.actualHours !== undefined)
          data2.actualHours = maybeUpdates2.actualHours;
        if (maybeUpdates2.stepFunctionArn !== undefined)
          data2.stepFunctionArn = maybeUpdates2.stepFunctionArn;
        data2.dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined;

        await prisma.task.update({
          where: { id },
          data: data2,
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

// Export the class value so other scripts can call DatabaseManager.getInstance()
// DatabaseManager class is exported where it's declared above.
