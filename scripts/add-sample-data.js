// Script to add sample data to the database
async function addSampleTasks() {
  const baseUrl = "http://localhost:3000";

  const sampleTasks = [
    {
      title: "Implement Real-time Dashboard Updates",
      description:
        "Add WebSocket connections for real-time task status updates across all connected clients.",
      assignedTo: "employee-1",
      assignedBy: "admin-1",
      priority: "high",
      dueDate: "2025-08-20",
      estimatedHours: 20,
      tags: ["frontend", "websocket", "realtime"],
    },
    {
      title: "Create Mobile-Responsive UI Components",
      description:
        "Redesign all dashboard components to be fully responsive for mobile and tablet devices.",
      assignedTo: "designer-1",
      assignedBy: "manager-1",
      priority: "medium",
      dueDate: "2025-08-25",
      estimatedHours: 16,
      tags: ["ui", "mobile", "responsive", "design"],
    },
    {
      title: "Database Performance Optimization",
      description:
        "Optimize SQLite queries and add proper indexing for better performance with large datasets.",
      assignedTo: "employee-1",
      assignedBy: "admin-1",
      priority: "medium",
      dueDate: "2025-08-30",
      estimatedHours: 12,
      tags: ["database", "performance", "optimization"],
    },
    {
      title: "Unit Testing Implementation",
      description:
        "Create comprehensive unit tests for all API endpoints and core business logic.",
      assignedTo: "qa-1",
      assignedBy: "manager-1",
      priority: "high",
      dueDate: "2025-09-05",
      estimatedHours: 24,
      tags: ["testing", "qa", "automation"],
    },
    {
      title: "Docker Containerization Setup",
      description:
        "Create production-ready Docker containers for easy deployment and scaling.",
      assignedTo: "admin-1",
      assignedBy: "admin-1",
      priority: "low",
      dueDate: "2025-09-10",
      estimatedHours: 8,
      tags: ["docker", "devops", "deployment"],
    },
  ];

  for (const task of sampleTasks) {
    try {
      const response = await fetch(`${baseUrl}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created task: ${task.title}`);
      } else {
        console.error(`❌ Failed to create task: ${task.title}`);
      }
    } catch (error) {
      console.error(`❌ Error creating task ${task.title}:`, error);
    }
  }
}

async function addSampleWorkers() {
  const baseUrl = "http://localhost:3000";

  const sampleWorkers = [
    {
      name: "Sarah Chen",
      pronouns: "she/her",
      jobRole: "Developer",
      email: "sarah.chen@syncertica.com",
    },
    {
      name: "Marcus Rodriguez",
      pronouns: "he/him",
      jobRole: "UI/UX Designer",
      email: "marcus.rodriguez@syncertica.com",
    },
    {
      name: "Taylor Kim",
      pronouns: "they/them",
      jobRole: "QA",
      email: "taylor.kim@syncertica.com",
    },
  ];

  for (const worker of sampleWorkers) {
    try {
      const response = await fetch(`${baseUrl}/api/workers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(worker),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created worker: ${worker.name}`);
      } else {
        console.error(`❌ Failed to create worker: ${worker.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating worker ${worker.name}:`, error);
    }
  }
}

// Run the script
console.log("🚀 Adding sample data to database...");
addSampleWorkers()
  .then(() => {
    console.log("👥 Sample workers added!");
    return addSampleTasks();
  })
  .then(() => {
    console.log("📋 Sample tasks added!");
    console.log("✅ All sample data has been added successfully!");
  })
  .catch((error) => {
    console.error("❌ Error adding sample data:", error);
  });
