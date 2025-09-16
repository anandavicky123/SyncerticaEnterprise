import { PrismaClient } from "@prisma/client";
import { DatabaseManager } from "../lib/database";

const prisma = new PrismaClient();
const db = DatabaseManager.getInstance();

async function main() {
  // Create a test manager first
  const testManager = await prisma.manager.upsert({
    where: { deviceUUID: "11111111-1111-1111-1111-111111111111" },
    update: {},
    create: {
      deviceUUID: "11111111-1111-1111-1111-111111111111",
      name: "Test Manager",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "24h",
    },
  });

  // Seed other data
  await db.seedData(testManager.deviceUUID);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
