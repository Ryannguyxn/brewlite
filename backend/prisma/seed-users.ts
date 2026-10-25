/**
 * BrewLite – isolated demo User seed for Sprint 3 database verification.
 * Run from backend/: npx --no-install tsx prisma/seed-users.ts
 * Requirements: DATABASE_URL to an isolated brewlite_seed_* DB,
 * SEED_DEMO_USER_PASSWORD (>= 8 chars), applied migrations, generated Prisma client.
 * Does not modify the Product Catalog seed or existing User accounts.
 */
import "dotenv/config";
import * as argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

const parsed = new URL(databaseUrl);
const databaseName = decodeURIComponent(parsed.pathname.slice(1));
if (!/^brewlite_seed_[a-z0-9_]+$/i.test(databaseName)) {
  throw new Error(`Demo User seeding is only allowed on brewlite_seed_* databases (received: ${databaseName})`);
}

const demoPassword = process.env.SEED_DEMO_USER_PASSWORD;
if (!demoPassword || demoPassword.length < 8) {
  throw new Error("SEED_DEMO_USER_PASSWORD must be set (minimum 8 characters)");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const demoUsers = [
  { id: "f1000000-0000-4000-8000-000000000001", email: "demo.customer1@brewlite.test", fullName: "Khách hàng Demo 1" },
  { id: "f1000000-0000-4000-8000-000000000002", email: "demo.customer2@brewlite.test", fullName: "Khách hàng Demo 2" },
] as const;

async function main() {
  const existingEmails = await prisma.user.findMany({
    where: { email: { in: demoUsers.map((u) => u.email) } },
    select: { email: true },
  });
  if (existingEmails.length > 0) {
    // Never reset existing users' password hashes or loyalty balances during seed.
    console.log(`Demo users already present (${existingEmails.length}); no existing accounts modified.`);
  }

  const hashedPassword = await argon2.hash(demoPassword, { type: argon2.argon2id });
  let created = 0;
  for (const user of demoUsers) {
    const result = await prisma.user.createMany({
      data: [{
        id: user.id,
        email: user.email,
        passwordHash: hashedPassword,
        fullName: user.fullName,
        loyaltyPoints: 0,
      }],
      skipDuplicates: true,
    });
    created += result.count;
  }
  console.log(`Demo User seed complete: ${created} created, ${demoUsers.length - created} already existed.`);
}

main()
  .catch((error) => {
    console.error("Demo User seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
