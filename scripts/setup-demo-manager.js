import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupInitialData() {
  try {
    // Create a manager with the temporary UUID
    const managerUUID = "123e4567-e89b-12d3-a456-426614174000";

    // Check if manager already exists
    const existingManager = await prisma.manager.findUnique({
      where: { deviceUUID: managerUUID },
    });

    if (!existingManager) {
      await prisma.manager.create({
        data: {
          deviceUUID: managerUUID,
          name: "Demo Manager",
          dateFormat: "YYYY-MM-DD",
          timeFormat: "24",
        },
      });
      console.log("Demo manager created successfully");
    } else {
      console.log("Demo manager already exists");
    }

    console.log("Initial data setup complete");
  } catch (error) {
    console.error("Error setting up initial data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupInitialData();
