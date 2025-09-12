import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function run() {
  try {
    // Find a task, manager and worker to use for test inserts.
    const task = await prisma.task.findFirst({ select: { id: true } });
    if (!task) throw new Error("No task found in DB to use for test insert");
    const taskId = task.id;

    const manager = await prisma.manager.findFirst({ select: { deviceUUID: true } });
    if (!manager) throw new Error("No manager found in DB to use for test insert");
    const managerDeviceUUID = manager.deviceUUID;

    const worker = await prisma.worker.findFirst({ select: { id: true } });
    if (!worker) throw new Error("No worker found in DB to use for test insert");
    const workerId = worker.id;

    // Manager-style message: managerdeviceuuid set (uuid column), workerid NULL (text column)
    const id1 = crypto.randomUUID();
    const inserted1 = (await prisma.$queryRaw`
      INSERT INTO chats (id, taskid, workerid, managerdeviceuuid, content, createdat)
      VALUES (
        ${id1},
        ${taskId},
        NULL,
        ${managerDeviceUUID}::uuid,
        ${"manager test message"},
        now()
      )
      RETURNING id, taskid, workerid, managerdeviceuuid, content, createdat
    `) as unknown;

    console.log("Manager insert result:", inserted1);

    // Worker-style message: workerid set (text column), managerdeviceuuid NULL
    const id2 = crypto.randomUUID();
    const inserted2 = (await prisma.$queryRaw`
      INSERT INTO chats (id, taskid, workerid, managerdeviceuuid, content, createdat)
      VALUES (
        ${id2},
        ${taskId},
        ${workerId},
        NULL,
        ${"worker test message"},
        now()
      )
      RETURNING id, taskid, workerid, managerdeviceuuid, content, createdat
    `) as unknown;

    console.log("Worker insert result:", inserted2);
  } catch (e) {
    console.error("Test insert failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
