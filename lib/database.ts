import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Database types
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
  tags: string[]; // Will be converted from comma-separated string in database
  estimatedHours?: number;
  actualHours?: number;
  stepFunctionArn?: string;
}

export interface Worker {
  id: string;
  name: string;
  pronouns: string;
  jobRole: "UI/UX Designer" | "Developer" | "Manager" | "QA";
  email?: string;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repository?: string;
  status: "active" | "inactive" | "completed";
  createdAt: string;
  updatedAt: string;
}

class DatabaseManager {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Create database directory if it doesn't exist
    const dbDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, "syncertica.db");
    this.db = new Database(this.dbPath);
    this.initializeTables();
    this.seedData();
  }

  private initializeTables() {
    // Create Workers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pronouns TEXT NOT NULL,
        jobRole TEXT NOT NULL CHECK (jobRole IN ('UI/UX Designer', 'Developer', 'Manager', 'QA')),
        email TEXT,
        avatar TEXT,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        repository TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'completed')) DEFAULT 'active',
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('todo', 'doing', 'done', 'blocked')) DEFAULT 'todo',
        priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
        assignedTo TEXT NOT NULL,
        assignedBy TEXT NOT NULL,
        projectId TEXT,
        dueDate TEXT,
        estimatedHours INTEGER,
        actualHours INTEGER,
        stepFunctionArn TEXT,
        tags TEXT, -- Store tags as comma-separated string
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assignedTo) REFERENCES workers (id),
        FOREIGN KEY (assignedBy) REFERENCES workers (id),
        FOREIGN KEY (projectId) REFERENCES projects (id)
      )
    `);
  }

  private seedData() {
    // Check if data already exists
    const workerCount = this.db
      .prepare("SELECT COUNT(*) as count FROM workers")
      .get() as { count: number };
    if (workerCount.count > 0) return;

    // Seed Workers
    const insertWorker = this.db.prepare(`
      INSERT INTO workers (id, name, pronouns, jobRole, email) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const workers = [
      {
        id: "admin-1",
        name: "John Admin",
        pronouns: "he/him",
        jobRole: "Manager",
        email: "admin@syncertica.com",
      },
      {
        id: "employee-1",
        name: "Jane Employee",
        pronouns: "she/her",
        jobRole: "Developer",
        email: "employee@syncertica.com",
      },
      {
        id: "manager-1",
        name: "Mike Manager",
        pronouns: "he/him",
        jobRole: "Manager",
        email: "manager@syncertica.com",
      },
      {
        id: "designer-1",
        name: "Alice Johnson",
        pronouns: "she/her",
        jobRole: "UI/UX Designer",
        email: "alice.johnson@syncertica.com",
      },
      {
        id: "qa-1",
        name: "Diana Lee",
        pronouns: "she/her",
        jobRole: "QA",
        email: "diana.lee@syncertica.com",
      },
    ];

    workers.forEach((worker) => {
      insertWorker.run(
        worker.id,
        worker.name,
        worker.pronouns,
        worker.jobRole,
        worker.email
      );
    });

    // Seed Projects
    const insertProject = this.db.prepare(`
      INSERT INTO projects (id, name, description, repository, status) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const projects = [
      {
        id: "project-1",
        name: "Syncertica Enterprise",
        description: "Main enterprise management platform",
        repository: "SyncerticaEnterprise",
        status: "active",
      },
      {
        id: "project-2",
        name: "Mobile App",
        description: "Mobile companion app for the platform",
        repository: "SyncerticaMobile",
        status: "active",
      },
      {
        id: "project-3",
        name: "API Gateway",
        description: "Microservices API gateway",
        repository: "SyncerticaAPI",
        status: "completed",
      },
    ];

    projects.forEach((project) => {
      insertProject.run(
        project.id,
        project.name,
        project.description,
        project.repository,
        project.status
      );
    });

    // Seed Tasks
    const insertTask = this.db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, assignedTo, assignedBy, projectId, dueDate, estimatedHours, actualHours, stepFunctionArn, tags) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tasks = [
      {
        id: "task-1",
        title: "Set up AWS Lambda functions for user authentication",
        description:
          "Implement serverless authentication using AWS Lambda and Cognito integration with JWT token validation.",
        status: "doing",
        priority: "high",
        assignedTo: "employee-1",
        assignedBy: "admin-1",
        projectId: "project-1",
        dueDate: "2024-01-20T17:00:00Z",
        estimatedHours: 16,
        actualHours: 12,
        stepFunctionArn:
          "arn:aws:states:us-east-1:123456789:stateMachine:TaskWorkflow",
        tags: "aws,lambda,authentication",
      },
      {
        id: "task-2",
        title: "Design DynamoDB schema for user data",
        description:
          "Create efficient NoSQL schema design for user profiles, permissions, and session management.",
        status: "todo",
        priority: "medium",
        assignedTo: "employee-1",
        assignedBy: "manager-1",
        projectId: "project-1",
        dueDate: "2024-01-25T17:00:00Z",
        estimatedHours: 8,
        actualHours: null,
        stepFunctionArn: null,
        tags: "aws,dynamodb,database",
      },
      {
        id: "task-3",
        title: "Implement CloudWatch monitoring dashboard",
        description:
          "Set up comprehensive monitoring with custom metrics, alarms, and automated alerting system.",
        status: "done",
        priority: "medium",
        assignedTo: "admin-1",
        assignedBy: "admin-1",
        projectId: "project-1",
        dueDate: "2024-01-15T17:00:00Z",
        estimatedHours: 12,
        actualHours: 10,
        stepFunctionArn: null,
        tags: "aws,cloudwatch,monitoring",
      },
      {
        id: "task-4",
        title: "Security audit and penetration testing",
        description:
          "Conduct comprehensive security assessment including AWS Security Hub integration and compliance checks.",
        status: "blocked",
        priority: "critical",
        assignedTo: "manager-1",
        assignedBy: "admin-1",
        projectId: "project-1",
        dueDate: "2024-01-30T17:00:00Z",
        estimatedHours: 24,
        actualHours: 4,
        stepFunctionArn: null,
        tags: "security,audit,compliance",
      },
    ];

    tasks.forEach((task) => {
      insertTask.run(
        task.id,
        task.title,
        task.description,
        task.status,
        task.priority,
        task.assignedTo,
        task.assignedBy,
        task.projectId,
        task.dueDate,
        task.estimatedHours,
        task.actualHours,
        task.stepFunctionArn,
        task.tags
      );
    });
  }

  // Worker methods
  getAllWorkers(): Worker[] {
    interface WorkerRow {
      id: string;
      name: string;
      pronouns: string;
      jobRole: string;
      email: string;
      avatar: string;
    }

    const rows = this.db
      .prepare("SELECT * FROM workers ORDER BY name")
      .all() as WorkerRow[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      pronouns: row.pronouns,
      jobRole: row.jobRole as Worker["jobRole"],
      email: row.email,
      avatar: row.avatar,
    }));
  }

  getWorkerById(id: string): Worker | null {
    const row = this.db.prepare("SELECT * FROM workers WHERE id = ?").get(id);
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      pronouns: row.pronouns,
      jobRole: row.jobRole as Worker["jobRole"],
      email: row.email,
      avatar: row.avatar,
    };
  }

  createWorker(worker: Omit<Worker, "id">): Worker {
    const id = `worker-${Date.now()}`;
    const insertWorker = this.db.prepare(`
      INSERT INTO workers (id, name, pronouns, jobRole, email, avatar) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertWorker.run(
      id,
      worker.name,
      worker.pronouns,
      worker.jobRole,
      worker.email || null,
      worker.avatar || null
    );

    return { id, ...worker };
  }

  updateWorker(id: string, updates: Partial<Omit<Worker, "id">>): boolean {
    const fields = Object.keys(updates).filter(
      (key) => updates[key] !== undefined
    );
    if (fields.length === 0) return false;

    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => updates[field]);
    values.push(id);

    const updateWorker = this.db.prepare(`
      UPDATE workers SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
    `);

    const result = updateWorker.run(...values);
    return result.changes > 0;
  }

  deleteWorker(id: string): boolean {
    const deleteWorker = this.db.prepare("DELETE FROM workers WHERE id = ?");
    const result = deleteWorker.run(id);
    return result.changes > 0;
  }

  // Task methods
  getAllTasks(): Task[] {
    const rows = this.db
      .prepare("SELECT * FROM tasks ORDER BY createdAt DESC")
      .all();

    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as Task["status"],
      priority: row.priority as Task["priority"],
      assignedTo: row.assignedTo,
      assignedBy: row.assignedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      dueDate: row.dueDate,
      tags: row.tags
        ? row.tags.split(",").map((tag: string) => tag.trim())
        : [],
      estimatedHours: row.estimatedHours,
      actualHours: row.actualHours,
      stepFunctionArn: row.stepFunctionArn,
    }));
  }

  getTaskById(id: string): Task | null {
    const row: any = this.db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(id);

    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as Task["status"],
      priority: row.priority as Task["priority"],
      assignedTo: row.assignedTo,
      assignedBy: row.assignedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      dueDate: row.dueDate,
      tags: row.tags
        ? row.tags.split(",").map((tag: string) => tag.trim())
        : [],
      estimatedHours: row.estimatedHours,
      actualHours: row.actualHours,
      stepFunctionArn: row.stepFunctionArn,
    };
  }

  createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const id = `task-${Date.now()}`;
    const now = new Date().toISOString();
    const tagsString = task.tags.join(",");

    const insertTask = this.db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, assignedTo, assignedBy, dueDate, estimatedHours, stepFunctionArn, tags) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTask.run(
      id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.assignedTo,
      task.assignedBy,
      task.dueDate || null,
      task.estimatedHours || null,
      task.stepFunctionArn || null,
      tagsString
    );

    return {
      id,
      ...task,
      createdAt: now,
      updatedAt: now,
    };
  }

  updateTask(
    id: string,
    updates: Partial<Omit<Task, "id" | "createdAt">>
  ): boolean {
    const { tags, ...taskUpdates } = updates;

    // Update task fields (excluding tags)
    const fields = Object.keys(taskUpdates).filter(
      (key) => taskUpdates[key] !== undefined
    );
    if (fields.length > 0) {
      const setClause = fields.map((field) => `${field} = ?`).join(", ");
      const values = fields.map((field) => taskUpdates[field]);
      values.push(id);

      const updateTask = this.db.prepare(`
        UPDATE tasks SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?
      `);

      updateTask.run(...values);
    }

    // Update tags if provided
    if (tags) {
      // Delete existing tags
      this.db.prepare("DELETE FROM task_tags WHERE taskId = ?").run(id);

      // Insert new tags
      const insertTag = this.db.prepare(
        "INSERT INTO task_tags (taskId, tag) VALUES (?, ?)"
      );
      tags.forEach((tag) => {
        insertTag.run(id, tag);
      });
    }

    return true;
  }

  deleteTask(id: string): boolean {
    const deleteTask = this.db.prepare("DELETE FROM tasks WHERE id = ?");
    const result = deleteTask.run(id);
    return result.changes > 0;
  }

  // Project methods
  getAllProjects(): Project[] {
    const rows = this.db.prepare("SELECT * FROM projects ORDER BY name").all();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      repository: row.repository,
      status: row.status as Project["status"],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  createProject(
    project: Omit<Project, "id" | "createdAt" | "updatedAt">
  ): Project {
    const id = `project-${Date.now()}`;
    const now = new Date().toISOString();

    const insertProject = this.db.prepare(`
      INSERT INTO projects (id, name, description, repository, status) 
      VALUES (?, ?, ?, ?, ?)
    `);

    insertProject.run(
      id,
      project.name,
      project.description || null,
      project.repository || null,
      project.status
    );

    return {
      id,
      ...project,
      createdAt: now,
      updatedAt: now,
    };
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

export default DatabaseManager;
