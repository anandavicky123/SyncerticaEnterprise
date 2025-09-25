/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Mock Data Generator for Portfolio Management System
 *
 * This script generates realistic mock data for all tables when a new manager UUID is created.
 * It creates:
 * - 1 test manager record (optional, for testing)
 * - 5 workers with realistic names, emails, and job roles
 * - 6 projects with varied statuses (3 active)
 * - 12 tasks distributed across workers with realistic dates
 * - 13 chat messages simulating real conversations
 *
 * Usage: node scripts/generate-mock-data.js [managerUUID]
 * If no UUID provided, it will generate one.
 */

const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");
const crypto = require("crypto");

const prisma = new PrismaClient();

// Mock data arrays for realistic content
const workerNames = [
  {
    name: "Sarah Chen",
    pronouns: "she/her",
    jobRole: "UI/UX Designer",
    email: "sarah.chen",
  },
  {
    name: "Marcus Johnson",
    pronouns: "he/him",
    jobRole: "Developer",
    email: "marcus.johnson",
  },
  {
    name: "Alex Rivera",
    pronouns: "they/them",
    jobRole: "Developer",
    email: "alex.rivera",
  },
  {
    name: "Elena Kowalski",
    pronouns: "she/her",
    jobRole: "QA",
    email: "elena.kowalski",
  },
  {
    name: "Jordan Kim",
    pronouns: "he/him",
    jobRole: "IT Supports",
    email: "jordan.kim",
  },
];

const projectData = [
  {
    name: "E-Commerce Platform Redesign",
    description:
      "Complete redesign of the main e-commerce platform with modern UI/UX",
    status: 5,
  },
  {
    name: "Mobile App Development",
    description: "Native mobile application for iOS and Android platforms",
    status: 5,
  },
  {
    name: "API Integration Gateway",
    description: "Centralized API gateway for microservices architecture",
    status: 5,
  },
  {
    name: "Data Analytics Dashboard",
    description: "Real-time analytics dashboard for business intelligence",
    status: 6,
  },
  {
    name: "Customer Support Portal",
    description: "Self-service portal for customer support and documentation",
    status: 7,
  },
  {
    name: "Legacy System Migration",
    description: "Migration from legacy systems to cloud-native infrastructure",
    status: 8,
  },
];

const taskTitles = [
  "Implement user authentication system",
  "Design responsive navigation component",
  "Set up CI/CD pipeline configuration",
  "Create API documentation",
  "Optimize database query performance",
  "Build user profile management",
  "Implement real-time notifications",
  "Design mobile-first checkout flow",
  "Set up monitoring and logging",
  "Create automated testing suite",
  "Implement search functionality",
  "Build admin dashboard interface",
];

const taskDescriptions = [
  "Implement secure user authentication with JWT tokens, password hashing, and session management. Include forgot password functionality and email verification.",
  "Design and develop a responsive navigation component that works across all screen sizes. Should include mobile hamburger menu and desktop dropdown navigation.",
  "Configure automated CI/CD pipeline using GitHub Actions or similar. Include automated testing, code quality checks, and deployment to staging/production.",
  "Create comprehensive API documentation using OpenAPI/Swagger. Include endpoint descriptions, request/response examples, and authentication requirements.",
  "Analyze and optimize slow database queries. Implement proper indexing, query optimization, and consider caching strategies for frequently accessed data.",
  "Build comprehensive user profile management system. Allow users to update personal information, preferences, and account settings.",
  "Implement real-time notification system using WebSockets or Server-Sent Events. Include in-app notifications and email alerts for important events.",
  "Design mobile-first checkout flow with streamlined user experience. Include payment integration, shipping options, and order confirmation.",
  "Set up comprehensive monitoring and logging system. Include error tracking, performance monitoring, and alerting for critical issues.",
  "Create automated testing suite with unit tests, integration tests, and end-to-end tests. Ensure good code coverage and reliable test execution.",
  "Implement advanced search functionality with filters, sorting, and pagination. Include autocomplete and search result highlighting.",
  "Build admin dashboard interface for system management. Include user management, analytics, and system configuration options.",
];

const tags = [
  ["frontend", "react", "typescript"],
  ["backend", "nodejs", "database"],
  ["devops", "ci-cd", "automation"],
  ["documentation", "api", "swagger"],
  ["performance", "optimization", "database"],
  ["user-management", "authentication", "security"],
  ["real-time", "websockets", "notifications"],
  ["mobile", "responsive", "ux"],
  ["monitoring", "logging", "observability"],
  ["testing", "automation", "quality"],
  ["search", "elasticsearch", "performance"],
  ["admin", "dashboard", "management"],
];

const chatMessages = [
  // Manager to Workers
  "Hi team! Just wanted to check on the progress of the authentication system implementation. Any blockers I should know about?",
  "Great work on the navigation component! The responsive design looks fantastic across all devices.",
  "Can we schedule a quick meeting to discuss the API integration timeline? I want to make sure we're aligned on priorities.",

  // Workers to Manager
  "The CI/CD pipeline is almost ready. Just working through some deployment configuration issues, should be resolved by tomorrow.",
  "I've completed the database optimization work. Query performance has improved by 60% on average. Here's the report.",
  "Running into some challenges with the real-time notifications. The WebSocket connection keeps dropping. Need to investigate further.",

  // Worker to Worker
  "Hey, can you review my pull request for the user profile component? Would love your feedback on the validation logic.",
  "I noticed you're working on the search functionality. Want to pair program on the elasticsearch integration?",
  "The admin dashboard is looking great! Really like the data visualization components you built.",
  "Quick question about the monitoring setup - are you using Prometheus or a different solution?",
  "Thanks for helping with the mobile checkout flow testing. Found several edge cases we need to handle.",
  "The automated tests are failing on the staging environment. Can you help me debug the issue?",
  "Love the new design for the customer portal! The user experience is much more intuitive now.",
];

/**
 * Hash password using argon2id (same as used in the main application)
 */
async function hashPassword(password) {
  try {
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
}

/**
 * Generate a random date within the current month
 */
function getRandomDateThisMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const randomDay = Math.floor(Math.random() * daysInMonth) + 1;

  return new Date(year, month, randomDay);
}

/**
 * Generate a random date 2 months ago
 */
function getDateTwoMonthsAgo() {
  const now = new Date();
  const twoMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 2,
    now.getDate(),
  );
  const variation = Math.floor(Math.random() * 14) - 7; // ±7 days variation
  twoMonthsAgo.setDate(twoMonthsAgo.getDate() + variation);
  return twoMonthsAgo;
}

/**
 * Check if email already exists in the database
 */
async function isEmailTaken(email) {
  const existingWorker = await prisma.worker.findUnique({
    where: { email: email },
  });
  return !!existingWorker;
}

/**
 * Generate unique email for a worker
 */
async function generateUniqueEmail(baseEmail, domain = "@company.com") {
  let email = baseEmail + domain;
  let counter = 1;

  while (await isEmailTaken(email)) {
    email = baseEmail + counter + domain;
    counter++;
  }

  return email;
}

/**
 * Generate workers data
 */
async function generateWorkers(managerUUID, verbose = true) {
  if (verbose) console.log("📝 Generating workers...");
  const workers = [];
  const hashedPassword = await hashPassword("123456789");

  for (let i = 0; i < workerNames.length; i++) {
    const worker = workerNames[i];
    const workerId = crypto.randomUUID();
    const email = await generateUniqueEmail(worker.email);

    const workerData = {
      id: workerId,
      managerDeviceUUID: managerUUID,
      name: worker.name,
      pronouns: worker.pronouns,
      jobRole: worker.jobRole,
      email: email,
      passwordHash: hashedPassword,
      github_username: null, // As requested, leave null
      createdAt: getDateTwoMonthsAgo(),
      updatedAt: getDateTwoMonthsAgo(),
    };

    workers.push(workerData);
    if (verbose)
      console.log(`   → ${worker.name} (${worker.jobRole}) - ${email}`);
  }

  return workers;
}

/**
 * Generate projects data
 */
function generateProjects(managerUUID, verbose = true) {
  if (verbose) console.log("📂 Generating projects...");
  const projects = [];

  for (let i = 0; i < projectData.length; i++) {
    const project = projectData[i];
    const projectId = crypto.randomUUID();

    const projectDataRecord = {
      id: projectId,
      managerDeviceUUID: managerUUID,
      name: project.name,
      description: project.description,
      repository: null, // As requested, leave null
      statusId: project.status,
      createdAt: getDateTwoMonthsAgo(),
      updatedAt: getDateTwoMonthsAgo(),
    };

    projects.push(projectDataRecord);
    const statusName =
      project.status === 5
        ? "active"
        : project.status === 6
          ? "onhold"
          : project.status === 7
            ? "completed"
            : "archived";
    if (verbose) console.log(`   → ${project.name} (${statusName})`);
  }

  return projects;
}

/**
 * Generate tasks data
 */
function generateTasks(managerUUID, workers, projects, verbose = true) {
  if (verbose) console.log("📋 Generating tasks...");
  const tasks = [];

  // Task distribution: 3, 1, 3, 2, 3 tasks per worker
  const taskDistribution = [3, 1, 3, 2, 3];
  let taskIndex = 0;

  // Generate 5 completed tasks (statusId = 3) first
  let completedTasksCount = 0;

  for (let workerIndex = 0; workerIndex < workers.length; workerIndex++) {
    const worker = workers[workerIndex];
    const tasksForWorker = taskDistribution[workerIndex];

    for (let i = 0; i < tasksForWorker; i++) {
      if (taskIndex >= taskTitles.length) break;

      const taskId = crypto.randomUUID();
      const createdAt = getRandomDateThisMonth();

      // Determine if this should be a completed task
      const isCompleted = completedTasksCount < 5 && Math.random() < 0.6;
      const statusId = isCompleted
        ? 3
        : [1, 2, 4][Math.floor(Math.random() * 3)];

      // If completed, set updatedAt to a few days after createdAt
      let updatedAt = null;
      if (statusId === 3) {
        updatedAt = new Date(createdAt);
        updatedAt.setDate(
          updatedAt.getDate() + Math.floor(Math.random() * 5) + 1,
        );
        completedTasksCount++;
      }

      // Randomly assign to a project
      const randomProject =
        projects[Math.floor(Math.random() * projects.length)];

      const taskData = {
        id: taskId,
        title: taskTitles[taskIndex],
        description: taskDescriptions[taskIndex],
        statusId: statusId,
        priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        assignedTo: worker.id,
        assignedBy: managerUUID,
        projectId: randomProject.id,
        dueDate: null, // Can be null as per schema
        tags: tags[taskIndex] || ["general"],
        createdAt: createdAt,
        updatedAt: updatedAt,
      };

      tasks.push(taskData);
      const statusName =
        statusId === 1
          ? "todo"
          : statusId === 2
            ? "doing"
            : statusId === 3
              ? "done"
              : "blocked";
      if (verbose)
        console.log(
          `   → ${taskTitles[taskIndex]} (${worker.name}, ${statusName})`,
        );

      taskIndex++;
    }
  }

  return tasks;
}

/**
 * Generate chat messages
 */
function generateChats(managerUUID, workers, verbose = true) {
  if (verbose) console.log("💬 Generating chat messages...");
  const chats = [];

  for (let i = 0; i < 13; i++) {
    const chatId = crypto.randomUUID();
    const message = chatMessages[i % chatMessages.length];

    let senderId, receiverId;

    if (i < 3) {
      // Manager to worker messages
      senderId = `manager:${managerUUID}`; // Prefix manager UUID with "manager:"
      receiverId = workers[i % workers.length].id;
      if (verbose)
        console.log(
          `   → Manager → ${workers[i % workers.length].name.split(" ")[0]}: "${message.substring(0, 50)}..."`,
        );
    } else if (i < 6) {
      // Worker to manager messages
      senderId = workers[(i - 3) % workers.length].id;
      receiverId = `manager:${managerUUID}`; // Prefix manager UUID with "manager:"
      if (verbose)
        console.log(
          `   → ${workers[(i - 3) % workers.length].name.split(" ")[0]} → Manager: "${message.substring(0, 50)}..."`,
        );
    } else {
      // Worker to worker messages
      const senderIndex = Math.floor(Math.random() * workers.length);
      let receiverIndex = Math.floor(Math.random() * workers.length);
      while (receiverIndex === senderIndex) {
        receiverIndex = Math.floor(Math.random() * workers.length);
      }

      senderId = workers[senderIndex].id;
      receiverId = workers[receiverIndex].id;
      if (verbose)
        console.log(
          `   → ${workers[senderIndex].name.split(" ")[0]} → ${workers[receiverIndex].name.split(" ")[0]}: "${message.substring(0, 50)}..."`,
        );
    }

    const chatData = {
      id: chatId,
      senderId: senderId,
      receiverId: receiverId,
      content: message,
      createdAt: getRandomDateThisMonth(),
    };

    chats.push(chatData);
  }

  return chats;
}

/**
 * Main function to generate all mock data
 * Can be called directly or as a module
 */
async function generateMockData(
  managerUUID,
  options = { verbose: true, skipChats: false },
) {
  let prismaInstance = null;
  try {
    // Use provided prisma instance or create new one
    prismaInstance = options.prisma || prisma;

    if (options.verbose) {
      console.log(
        `🚀 Starting mock data generation for manager: ${managerUUID}`,
      );
      console.log("=".repeat(60));
    }

    // Check if manager already exists, if not create one
    let manager = await prismaInstance.manager.findUnique({
      where: { deviceUUID: managerUUID },
    });

    if (!manager) {
      if (options.verbose) console.log("👤 Creating test manager record...");
      manager = await prismaInstance.manager.create({
        data: {
          deviceUUID: managerUUID,
          name: "Portfolio Manager",
          dateFormat: "YYYY-MM-DD",
          timeFormat: "24",
          email: "manager@company.com",
        },
      });
      if (options.verbose) console.log(`   → Manager created: ${manager.name}`);
    } else {
      if (options.verbose)
        console.log("👤 Manager already exists, using existing record");
    }

    // Check if mock data already exists to avoid duplicates
    const existingWorkers = await prismaInstance.worker.count({
      where: { managerDeviceUUID: managerUUID },
    });

    if (existingWorkers > 0) {
      if (options.verbose) {
        console.log(
          `ℹ️  Manager ${managerUUID} already has ${existingWorkers} workers. Skipping mock data generation.`,
        );
      }
      return {
        success: true,
        message: "Mock data already exists for this manager",
        managerUUID,
        existingData: {
          workers: existingWorkers,
        },
      };
    }

    // Generate data
    const workers = await generateWorkers(managerUUID, options.verbose);
    const projects = generateProjects(managerUUID, options.verbose);
    const tasks = generateTasks(
      managerUUID,
      workers,
      projects,
      options.verbose,
    );

    // Only generate chats if not skipping them
    let chats = [];
    if (!options.skipChats) {
      chats = generateChats(managerUUID, workers, options.verbose);
    } else if (options.verbose) {
      console.log("⏩ Skipping chat generation as requested");
    }

    if (options.verbose) console.log("\n💾 Inserting data into database...");

    // Insert workers
    for (const worker of workers) {
      await prismaInstance.worker.create({ data: worker });
    }
    if (options.verbose)
      console.log(`   ✅ Inserted ${workers.length} workers`);

    // Insert projects
    for (const project of projects) {
      await prismaInstance.project.create({ data: project });
    }
    if (options.verbose)
      console.log(`   ✅ Inserted ${projects.length} projects`);

    // Insert tasks
    for (const task of tasks) {
      await prismaInstance.task.create({ data: task });
    }
    if (options.verbose) console.log(`   ✅ Inserted ${tasks.length} tasks`);

    // Insert chats only if we generated them
    if (chats.length > 0) {
      for (const chat of chats) {
        await prismaInstance.chats.create({ data: chat });
      }
      if (options.verbose)
        console.log(`   ✅ Inserted ${chats.length} chat messages`);
    }

    if (options.verbose) {
      console.log("\n🎉 Mock data generation completed successfully!");
      console.log("=".repeat(60));
      console.log(`📊 Summary:`);
      console.log(`   • Manager UUID: ${managerUUID}`);
      console.log(`   • Workers: ${workers.length}`);
      console.log(
        `   • Projects: ${projects.length} (3 active, 1 onhold, 1 completed, 1 archived)`,
      );
      console.log(
        `   • Tasks: ${tasks.length} (5 completed, 7 in various stages)`,
      );
      console.log(`   • Chat messages: ${chats.length}`);
      console.log(`   • All passwords: "123456789" (hashed with argon2id)`);
    }

    return {
      success: true,
      message: "Mock data generated successfully",
      managerUUID,
      data: {
        workers: workers.length,
        projects: projects.length,
        tasks: tasks.length,
        chats: chats.length,
      },
    };
  } catch (error) {
    console.error("❌ Error generating mock data:", error);
    return {
      success: false,
      message: error.message,
      managerUUID,
      error: error,
    };
  }
}

/**
 * CLI interface
 */
async function main() {
  try {
    // Get manager UUID from command line or generate one
    const managerUUID = process.argv[2] || crypto.randomUUID();

    if (!process.argv[2]) {
      console.log(`🔧 No UUID provided, generated new one: ${managerUUID}`);
      console.log("   You can use this UUID for testing in your application.");
      console.log("");
    }

    await generateMockData(managerUUID);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Export functions for potential reuse
module.exports = {
  generateMockData,
  hashPassword,
  generateWorkers,
  generateProjects,
  generateTasks,
  generateChats,
};

// Run if called directly
if (require.main === module) {
  main();
}
