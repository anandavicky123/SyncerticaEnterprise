import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // counts
    const managersCount =
      await prisma.$queryRaw`SELECT count(*)::int as count FROM managers`;
    const workersCount =
      await prisma.$queryRaw`SELECT count(*)::int as count FROM workers`;

    console.log("managersCount:", managersCount);
    console.log("workersCount:", workersCount);

    // check if tasks.updatedat column exists
    const updatedatExists =
      await prisma.$queryRaw`SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='updatedat') as exists`;
    console.log("tasks.updatedat exists:", updatedatExists);

    // Try to fetch a task with selected columns (id, title, updatedat) using raw query to avoid Prisma client mapping errors
    const tasks =
      await prisma.$queryRaw`SELECT id, title, (case when to_regclass('public.updatedat') is null then NULL else updatedat end) as updatedat FROM tasks LIMIT 5`;
    console.log("tasks sample (raw):", tasks);
  } catch (e) {
    console.error("Error during inspection:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
