// Simple script to migrate the database schema - removes task_tags table and adds tags column to tasks
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "syncertica.db");
const db = new Database(dbPath);

console.log("🔄 Starting database migration...");

try {
  // Begin transaction
  db.exec("BEGIN");

  // Drop the old task_tags table
  console.log("🗑️ Dropping task_tags table...");
  db.exec("DROP TABLE IF EXISTS task_tags");

  // Add tags column to tasks table (if it doesn't exist)
  console.log("➕ Adding tags column to tasks table...");
  try {
    db.exec("ALTER TABLE tasks ADD COLUMN tags TEXT");
  } catch (error) {
    if (error.message.includes("duplicate column name")) {
      console.log("✅ Tags column already exists");
    } else {
      throw error;
    }
  }

  // Update existing tasks to have some sample tags
  console.log("🏷️ Adding sample tags to existing tasks...");
  const tasks = db.prepare("SELECT id, title FROM tasks").all();
  const updateTask = db.prepare("UPDATE tasks SET tags = ? WHERE id = ?");

  tasks.forEach((task) => {
    // Generate some sample tags based on task title
    let tags = [];
    const title = task.title.toLowerCase();

    if (
      title.includes("aws") ||
      title.includes("lambda") ||
      title.includes("cloudwatch") ||
      title.includes("dynamodb")
    ) {
      tags.push("aws");
    }
    if (
      title.includes("auth") ||
      title.includes("security") ||
      title.includes("audit")
    ) {
      tags.push("security");
    }
    if (title.includes("database") || title.includes("dynamodb")) {
      tags.push("database");
    }
    if (title.includes("monitoring") || title.includes("cloudwatch")) {
      tags.push("monitoring");
    }
    if (title.includes("lambda")) {
      tags.push("lambda");
    }
    if (
      title.includes("ui") ||
      title.includes("design") ||
      title.includes("responsive")
    ) {
      tags.push("frontend");
    }
    if (title.includes("test") || title.includes("qa")) {
      tags.push("testing");
    }
    if (title.includes("docker") || title.includes("container")) {
      tags.push("devops");
    }

    // Add a default tag if no specific tags found
    if (tags.length === 0) {
      tags.push("general");
    }

    updateTask.run(tags.join(","), task.id);
    console.log(
      `✅ Updated task "${task.title}" with tags: ${tags.join(", ")}`
    );
  });

  // Commit transaction
  db.exec("COMMIT");

  console.log("✅ Database migration completed successfully!");
  console.log("📊 Summary:");
  console.log("   - Removed task_tags table");
  console.log("   - Added tags column to tasks table");
  console.log(`   - Updated ${tasks.length} tasks with sample tags`);
} catch (error) {
  // Rollback on error
  db.exec("ROLLBACK");
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
} finally {
  db.close();
}
