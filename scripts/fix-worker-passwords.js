// Script to fix worker passwords by re-hashing them with argon2id
const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");

const prisma = new PrismaClient();

async function hashPassword(password) {
  try {
    console.log("Hashing password with argon2id...");
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
      hashLength: 32,
    });
    console.log("Generated hash length:", hash.length);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
}

async function fixWorkerPasswords() {
  try {
    console.log("🔍 Checking for workers in the database...");

    const workers = await prisma.worker.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    console.log(`📊 Found ${workers.length} workers in the database`);

    if (workers.length === 0) {
      console.log("✅ No workers found. No action needed.");
      return;
    }

    for (const worker of workers) {
      console.log(`\n🔧 Processing worker: ${worker.name} (${worker.email})`);
      console.log(`Current hash: ${worker.passwordHash.substring(0, 20)}...`);

      // Check if the hash looks like bcryptjs (starts with $2a, $2b, $2x, $2y)
      const isBcryptHash = /^\$2[abxy]\$/.test(worker.passwordHash);

      if (isBcryptHash) {
        console.log(
          `⚠️  Worker ${worker.email} has bcryptjs hash, needs to be reset`,
        );
        console.log(
          `❗ Please manually reset password for ${worker.email} using the UI`,
        );
        console.log(`   Default password suggestion: "password123"`);
      } else if (worker.passwordHash.startsWith("$argon2id$")) {
        console.log(`✅ Worker ${worker.email} already has argon2id hash`);
      } else {
        console.log(`❓ Worker ${worker.email} has unknown hash format`);
      }
    }

    console.log("\n🎯 Summary:");
    console.log(
      "- If any workers have bcryptjs hashes, they need password reset",
    );
    console.log(
      "- You can delete and recreate workers, or manually reset via UI",
    );
    console.log("- New workers will automatically use argon2id hashing");
  } catch (error) {
    console.error("❌ Error fixing worker passwords:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixWorkerPasswords();
