import { v4 as uuidv4 } from "uuid";
import * as argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { createSession, createAuditLog } from "./dynamodb";

const prisma = new PrismaClient();

// Manager UUID management
export function generateManagerUUID(): string {
  return uuidv4();
}

export function getManagerUUIDFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("manager-uuid");
}

export function saveManagerUUIDToStorage(uuid: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("manager-uuid", uuid);
}

export async function createOrGetManager(
  deviceUUID: string,
  name?: string
): Promise<any> {
  try {
    // Try to find existing manager

    let manager = await prisma.manager.findUnique({
      where: { deviceUUID },
    });

    if (!manager) {
      // Create new manager
      manager = await prisma.manager.create({
        data: {
          deviceUUID,
          name: name || "Manager",
        },
      });
      console.log("[auth.createOrGetManager] Created new manager:", {
        deviceUUID,
        name: manager.name,
        email: manager.email,
      });
      // Log manager creation
      await createAuditLog(
        "manager",
        deviceUUID,
        "MANAGER_CREATED",
        "manager",
        deviceUUID,
        { name: manager.name }
      );
    } else {
      console.log("[auth.createOrGetManager] Found existing manager:", {
        deviceUUID,
        name: manager.name,
        email: manager.email,
      });
    }

    // Create session
    const sessionId = await createSession("manager", deviceUUID);

    return { manager, sessionId };
  } catch (error) {
    console.error("Error creating/getting manager:", error);
    throw error;
  }
}

// Worker authentication
export async function hashPassword(password: string): Promise<string> {
  try {
    console.log("Hashing password...");
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
      hashLength: 32, // Explicitly set hash length
    });
    console.log("Generated hash length:", hash.length);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    throw error;
  }
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    console.log("Verifying password hash...");
    console.log("Hash length:", hash.length);
    console.log("Password length:", password.length);
    const result = await argon2.verify(hash, password);
    console.log("Argon2 verification result:", result);
    return result;
  } catch (error) {
    console.error("Error verifying password:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return false;
  }
}

export async function createWorker(
  managerDeviceUUID: string,
  email: string,
  password: string,
  name: string,
  jobRole: string,
  pronouns?: string
): Promise<any> {
  try {
    // Check worker limit (5 workers per manager)
    const workerCount = await prisma.worker.count({
      where: { managerDeviceUUID },
    });

    if (workerCount >= 5) {
      throw new Error("WORKER_LIMIT_REACHED");
    }

    // Check if email already exists
    const existingWorker = await prisma.worker.findUnique({
      where: { email },
    });

    if (existingWorker) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate worker ID
    const workerId = uuidv4();

    // Create worker
    const worker = await prisma.worker.create({
      data: {
        id: workerId,
        managerDeviceUUID,
        name,
        pronouns,
        jobRole,
        email,
        passwordHash,
      },
    });

    // Log worker creation
    await createAuditLog(
      "manager",
      managerDeviceUUID,
      "WORKER_CREATED",
      "worker",
      workerId,
      { email, name, jobRole }
    );

    return worker;
  } catch (error) {
    console.error("Error creating worker:", error);
    throw error;
  }
}

export async function authenticateWorker(
  email: string,
  password: string
): Promise<any> {
  try {
    // Find worker by email
    console.log("Attempting to find worker with email:", email);
    const worker = await prisma.worker.findUnique({
      where: { email },
    });

    if (!worker) {
      console.log("Worker not found with email:", email);
      // Log failed login attempt
      await createAuditLog(
        "worker",
        "unknown",
        "LOGIN_FAILED",
        "worker",
        undefined,
        { email, reason: "user_not_found" }
      );
      throw new Error("INVALID_CREDENTIALS");
    }

    console.log("Worker found, verifying password...");
    // Verify password
    const isValidPassword = await verifyPassword(worker.passwordHash, password);
    console.log("Password verification result:", isValidPassword);

    if (!isValidPassword) {
      console.log("Password verification failed for worker:", worker.id);
      // Log failed login attempt
      await createAuditLog(
        "worker",
        worker.id,
        "LOGIN_FAILED",
        "worker",
        worker.id,
        { email, reason: "invalid_password" }
      );
      throw new Error("INVALID_CREDENTIALS");
    }

    // Create session
    const sessionId = await createSession("worker", worker.id);

    // Log successful login
    await createAuditLog(
      "worker",
      worker.id,
      "LOGIN_SUCCESS",
      "worker",
      worker.id,
      { email }
    );

    return { worker, sessionId };
  } catch (error) {
    console.error("Error authenticating worker:", error);
    throw error;
  }
}

export async function getWorkersByManager(
  managerDeviceUUID: string
): Promise<any[]> {
  try {
    return await prisma.worker.findMany({
      where: { managerDeviceUUID },
      select: {
        id: true,
        name: true,
        pronouns: true,
        jobRole: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error("Error getting workers:", error);
    throw error;
  }
}

export async function deleteWorker(
  workerId: string,
  managerDeviceUUID: string
): Promise<void> {
  try {
    // Verify the worker belongs to this manager
    const worker = await prisma.worker.findFirst({
      where: {
        id: workerId,
        managerDeviceUUID,
      },
    });

    if (!worker) {
      throw new Error("WORKER_NOT_FOUND");
    }

    // Delete worker
    await prisma.worker.delete({
      where: { id: workerId },
    });

    // Log worker deletion
    await createAuditLog(
      "manager",
      managerDeviceUUID,
      "WORKER_DELETED",
      "worker",
      workerId,
      { email: worker.email, name: worker.name }
    );
  } catch (error) {
    console.error("Error deleting worker:", error);
    throw error;
  }
}
