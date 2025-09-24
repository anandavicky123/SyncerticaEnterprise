// app/api/test-db/route.js
import prisma from "../../lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW()`;
    return Response.json({ db_time: result });
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    return new Response(
      JSON.stringify({ error: "DB connection failed", details: err.message }),
      { status: 500 },
    );
  }
}
