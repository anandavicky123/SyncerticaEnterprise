import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // List all check constraints for the 'chats' table
  const rows = await prisma.$queryRaw<Array<{ conname: string; def: string }>>`
    SELECT c.conname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'chats' AND c.contype = 'c'
  `;

  if (!rows || rows.length === 0) {
    console.log("No CHECK constraints found on table 'chats'.");
  } else {
    console.log(`Found ${rows.length} CHECK constraint(s) on 'chats':`);
    for (const r of rows) {
      console.log(`- ${r.conname}: ${r.def}`);
    }
  }

  // Also show table columns and types to help diagnose mismatch
  const cols = await prisma.$queryRaw<
    Array<{ column_name: string; data_type: string }>
  >`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'chats'
    ORDER BY ordinal_position
  `;

  console.log("\nColumns on chats:");
  for (const c of cols) {
    console.log(`- ${c.column_name}: ${c.data_type}`);
  }
}

main()
  .catch((e) => {
    console.error("Error running inspection script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
